import os
import re
from pathlib import Path
from typing import List, Dict, Any

class ParsedChunk:
    def __init__(
        self,
        content: str,
        source_location: str,
        page_number: int | None = None,
        slide_number: int | None = None,
        timestamp_seconds: float | None = None,
        topic: str = "General",
        subtopic: str = "General"
    ):
        self.content = content.strip()
        self.source_location = source_location
        self.page_number = page_number
        self.slide_number = slide_number
        self.timestamp_seconds = timestamp_seconds
        self.topic = topic
        self.subtopic = subtopic

class DocumentParserService:
    """Multimodal document parsing for PDFs, PowerPoint decks, and Video/Audio transcripts."""

    @staticmethod
    def parse_pdf(file_path: str | Path) -> List[ParsedChunk]:
        """Extract text page-by-page using PyMuPDF (fitz), preserving page numbers."""
        import fitz # PyMuPDF
        chunks = []
        doc = fitz.open(str(file_path))
        
        for page_idx in range(len(doc)):
            page_num = page_idx + 1
            page = doc[page_idx]
            text = page.get_text("text").strip()
            if not text:
                continue

            # Split larger pages into logical sections/paragraphs if length exceeds 800 chars
            paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
            if not paragraphs:
                paragraphs = [text]

            # Determine topic heuristic from first line or text content
            first_line = text.split("\n")[0][:60]
            topic = DocumentParserService._infer_topic(text, default=first_line)

            for p_idx, para in enumerate(paragraphs):
                loc = f"Page {page_num}"
                chunks.append(ParsedChunk(
                    content=para,
                    source_location=loc,
                    page_number=page_num,
                    topic=topic,
                    subtopic=f"Section {p_idx + 1}"
                ))

        doc.close()
        return chunks

    @staticmethod
    def parse_pptx(file_path: str | Path) -> List[ParsedChunk]:
        """Extract slide-by-slide text, titles, notes using python-pptx, preserving slide numbers."""
        from pptx import Presentation
        chunks = []
        prs = Presentation(str(file_path))

        for slide_idx, slide in enumerate(prs.slides):
            slide_num = slide_idx + 1
            slide_texts = []

            # Extract shapes
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        txt = paragraph.text.strip()
                        if txt:
                            slide_texts.append(txt)

            # Extract notes if available
            try:
                if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                    note_txt = slide.notes_slide.notes_text_frame.text.strip()
                    if note_txt:
                        slide_texts.append(f"[Speaker Note]: {note_txt}")
            except Exception:
                pass

            combined_text = "\n".join(slide_texts).strip()
            if not combined_text:
                continue

            topic = DocumentParserService._infer_topic(combined_text, default=f"Slide {slide_num}")

            chunks.append(ParsedChunk(
                content=combined_text,
                source_location=f"Slide {slide_num}",
                slide_number=slide_num,
                topic=topic,
                subtopic=f"Slide Content {slide_num}"
            ))

        return chunks

    @staticmethod
    def parse_transcript(file_path: str | Path) -> List[ParsedChunk]:
        """Extract speech-to-text transcript lines preserving timestamps [MM:SS]."""
        chunks = []
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()

        # Matches formats like [02:15], [00:02:15], 02:15, or standard VTT/SRT timestamps
        ts_pattern = re.compile(r"\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\]?")
        current_ts_sec = 0.0
        current_ts_label = "00:00"
        buffer_text = []

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            match = ts_pattern.search(line_str)
            if match:
                # Flush previous buffer
                if buffer_text:
                    text_block = " ".join(buffer_text)
                    chunks.append(ParsedChunk(
                        content=text_block,
                        source_location=f"Timestamp {current_ts_label}",
                        timestamp_seconds=current_ts_sec,
                        topic=DocumentParserService._infer_topic(text_block, default="Video Lecture"),
                        subtopic="Audio Segment"
                    ))
                    buffer_text = []

                # Calculate new timestamp
                g = match.groups()
                if g[2] is not None:
                    # HH:MM:SS
                    current_ts_sec = int(g[0]) * 3600 + int(g[1]) * 60 + int(g[2])
                    current_ts_label = f"{int(g[0]):02d}:{int(g[1]):02d}:{int(g[2]):02d}"
                else:
                    # MM:SS
                    current_ts_sec = int(g[0]) * 60 + int(g[1])
                    current_ts_label = f"{int(g[0]):02d}:{int(g[1]):02d}"

                clean_line = ts_pattern.sub("", line_str).strip()
                if clean_line:
                    buffer_text.append(clean_line)
            else:
                buffer_text.append(line_str)

        if buffer_text:
            text_block = " ".join(buffer_text)
            chunks.append(ParsedChunk(
                content=text_block,
                source_location=f"Timestamp {current_ts_label}",
                timestamp_seconds=current_ts_sec,
                topic=DocumentParserService._infer_topic(text_block, default="Video Lecture"),
                subtopic="Audio Segment"
            ))

        return chunks

    @classmethod
    def parse_file(cls, file_path: str | Path, file_type: str) -> List[ParsedChunk]:
        """Dispatch parser based on file type."""
        ext = Path(file_path).suffix.lower()
        if ext == ".pdf" or file_type == "pdf":
            return cls.parse_pdf(file_path)
        elif ext in (".pptx", ".ppt") or file_type == "pptx":
            return cls.parse_pptx(file_path)
        elif ext in (".vtt", ".srt", ".txt", ".transcript") or "video" in file_type or "audio" in file_type:
            return cls.parse_transcript(file_path)
        else:
            # Fallback text parser
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            return [ParsedChunk(content=content, source_location="Document 1", page_number=1, topic="Overview")]

    @staticmethod
    def _infer_topic(text: str, default: str = "General") -> str:
        text_lower = text.lower()
        if "while loop" in text_lower or "do-while" in text_lower:
            return "While & Do-While Loops"
        elif "for loop" in text_lower or "nested loop" in text_lower:
            return "For Loops & Nested Iteration"
        elif "off-by-one" in text_lower or "boundary condition" in text_lower or "loop condition" in text_lower:
            return "Loop Conditions & Boundaries"
        elif "array" in text_lower or "index" in text_lower:
            return "Array Indexing & Traversal"
        elif "boolean" in text_lower or "operator" in text_lower or "relational" in text_lower:
            return "Relational & Boolean Operators"
        elif "if-else" in text_lower or "conditional" in text_lower or "branching" in text_lower:
            return "Conditionals & Branching"
        return default[:40]

    @staticmethod
    def extract_topics_list(chunks: List[ParsedChunk]) -> List[str]:
        topics = set()
        for c in chunks:
            if c.topic and c.topic not in ("General", "Video Lecture"):
                topics.add(c.topic)
        return sorted(list(topics)) if topics else ["Java Fundamentals", "Control Flow", "Loops"]
