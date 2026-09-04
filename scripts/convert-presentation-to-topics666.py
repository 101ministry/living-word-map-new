#!/usr/bin/env python3
"""Convert TOPICS 666 PRESENTATION.txt to numbered topics 666.txt format with root/fruit emojis."""

import re
import sys
from pathlib import Path

ROOT_EMOJI = {
    "loneliness and emotional brokenness": "🟤",
    "deception and falsehood": "🟣",
    "idolatry and person-worship": "⭕",
    "idolatry and self-worship": "⭕",
    "pride and self-exaltation": "🔴",
    "control and rebellion": "🔵",
    "bitterness and unforgiveness": "🟢",
    "addiction and bondage": "⚪",
    "unbelief and distrust of god": "🟡",
    "shame and false identity": "🩷",
    "covetousness and materialism": "⚫",
    "fear and insecurity": "🟠",
}

FRUIT_EMOJI = [
    ("sexual corruption of human and hybrid dna", "🟨"),
    ("sexual corruption", "🟨"),
    ("counterfeit spirituality", "🟩"),
    ("confusing preferences with stewardship", "⬛"),
    ("neglect and lack of stewardship", "⬛"),
    ("anger and violence", "🟥"),
    ("death and self-destruction", "🟫"),
    ("death and self destruction", "🟫"),
    ("abuse and exploitation of others", "◻️"),
    ("division and relational destruction", "🟧"),
    ("mental oppression and confusion", "🟪"),
    ("physical weakness and infirmity", "⬜"),
    ("false religion and doctrinal error", "🟦"),
    ("anti-christ or separation from god", "▫"),
    ("anti-christ spirit / separation from god", "▫"),
    ("occultism and counterfeit spirituality", "🟩"),
    ("human and hybrid dna", "🟨"),
]

EMOJI_RE = re.compile(
    r"[\U0001F300-\U0001FAFF\U00002600-\U000027BF\u25A0-\u25FF\u2B1B\u2B1C\u25AB\u25AA\u25FB\u25FC\u25FD\u25FE\u25C6\u25C7\u25A1\u25A0\u2B50\u2B55\u26AA\u26AB\u2B24\u2B1B\u2B1C\u25C6\u25C7\u25AB\u25AA\u25FB\u25FC\u25FD\u25FE\u2B50\u2B55\u26AA\u26AB\u2B24\u2B1B\u2B1C\u25C6\u25C7\u25AB\u25AA\u25FB\u25FC\u25FD\u25FE\uFE0F\u200D]+"
)


def slug(text: str) -> str:
    t = text.lower()
    t = re.sub(r"[\u201c\u201d\u2018\u2019\"']", " ", t)
    t = re.sub(r"^(spirit of|familiar identity of|interacting with the spirit of)\s+", "", t)
    t = re.sub(r"^(being in|being|having|using|going to|reading|playing with|participating in|a |an )\s+", "", t)
    t = re.sub(r"[^a-z0-9]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def strip_emoji(text: str) -> str:
    return re.sub(r"\s+", " ", EMOJI_RE.sub(" ", text)).strip()


def root_emoji(name: str) -> str:
    key = strip_emoji(name).lower().strip()
    return ROOT_EMOJI.get(key, "")


def fruit_emoji(name: str) -> str:
    key = strip_emoji(name).lower().strip()
    for pattern, emoji in FRUIT_EMOJI:
        if pattern in key or key.startswith(pattern):
            return emoji
    return ""


def inject_root_emoji(text: str) -> str:
    def repl(m):
        prefix, root_name = m.group(1), m.group(2).strip()
        em = root_emoji(root_name)
        if em and not EMOJI_RE.search(m.group(0)):
            return f"{prefix}{em} {root_name}"
        return m.group(0)

    text = re.sub(
        r"(?i)(from a root of|with the root of|root of)\s+([^;,\n]+)",
        repl,
        text,
    )
    return text


def inject_fruit_emojis(text: str) -> str:
    out = text
    for pattern, emoji in FRUIT_EMOJI:
        # Only inject if emoji not already adjacent
        regex = re.compile(
            rf"(?i)(?<![\U0001F300-\U0001FAFF\u25A0-\u25FF\u2B1B\u2B1C\u25AB\u25AA\u25FB\u25FC\u25FD\u25FE\u25C6\u25C7\u25A1\u25A0\u2B50\u2B55\u26AA\u26AB\u2B24\uFE0F])"
            rf"({re.escape(pattern)})",
        )

        def repl(m, e=emoji):
            return f"{e}{m.group(1)}"

        out = regex.sub(repl, out)
    return out


def load_chart(path: Path) -> dict[int, str]:
    chart = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\s*(\d{3})\.\s*(.+?)\s*$", line)
        if m:
            chart[int(m.group(1))] = m.group(2).strip()
    return chart


def parse_existing_topics(path: Path) -> dict[int, dict]:
    raw = path.read_text(encoding="utf-8")
    blocks = re.split(r"(?=\d{3}\.\s+\S)", raw)
    out = {}
    for block in blocks:
        b = block.strip()
        m = re.match(r"^(\d{3})\.", b)
        if not m:
            continue
        num = int(m.group(1))
        parts = b.split("~~~~~~~~~~~~")
        body = parts[0].strip()
        lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
        header = lines[0] if lines else ""
        detail = "\n\n".join(lines[1:]) if len(lines) > 1 else ""
        out[num] = {"header": header, "detail": detail}
    return out


def extract_root_from_line(line: str) -> tuple[str, str]:
    """Return (root_name_with_optional_emoji, emoji)."""
    line = line.strip()
    patterns = [
        r"(?i)(?:,\s*)?(?:from a|with the|and its)\s*(🟤|🟣|⭕|🔴|🔵|🟢|⚪|🟡|🩷|⚫|🟠)?\s*root of\s+([^;,\n]+)",
        r"(?i)root of\s*(🟤|🟣|⭕|🔴|🔵|🟢|⚪|🟡|🩷|⚫|🟠)?\s*([^;,\n]+)",
        r"(?i)from a root of\s*(🟤|🟣|⭕|🔴|🔵|🟢|⚪|🟡|🩷|⚫|🟠)?\s*([^;,\n]+)",
    ]
    for pat in patterns:
        m = re.search(pat, line)
        if m:
            em = m.group(1) or ""
            name = m.group(2).strip().rstrip(".")
            if not em:
                em = root_emoji(name)
            return (f"{em} {name}".strip() if em else name, em)
    return ("", "")


def extract_topic_phrase(line: str) -> str:
    line = line.strip()
    if re.match(r"(?i)^(because|happening because|is happening)", line):
        return ""
    line = strip_emoji(line)
    patterns = [
        r"(?i)^interacting with (?:the )?spirit of (.+)$",
        r"(?i)^interacting with (?:the )?spirit (.+)$",
        r"(?i)^interacting with (?:the )?(.+?) spirit\b",
        r"(?i)^interacting with (disembodied .+)$",
        r"(?i)^spirit of (.+)$",
        r"(?i)^(.+?),\s*with the root",
        r"(?i)^(.+?),\s*from a root",
        r"(?i)^(.+?)\s+with the root",
        r"(?i)^(.+?)\s+from a root",
        r"(?i)^(.+?),\s*is happening",
        r"(?i)^(.+?)\s+is happening",
        r"(?i)^(.+?);",
        r"(?i)^(.+)$",
    ]
    for pat in patterns:
        m = re.match(pat, line)
        if m:
            phrase = m.group(1).strip()
            phrase = re.split(r"\s+with the root", phrase, flags=re.I)[0]
            phrase = re.split(r"\s+from a root", phrase, flags=re.I)[0]
            phrase = re.split(r"\s+and its", phrase, flags=re.I)[0]
            phrase = phrase.rstrip(";,").strip()
            if phrase.lower().startswith("because"):
                continue
            return phrase
    return ""


def normalize_because_line(line: str) -> str:
    line = line.strip()
    line = re.sub(r"\.+$", ".", line)
    if not line.endswith("."):
        line += "."
    return line


def build_detail_line(topic_display: str, root_display: str, because: str, is_spirit: bool) -> str:
    because = because.strip()
    because = inject_fruit_emojis(because)
    because = inject_root_emoji(because)

    topic_lower = topic_display.lower()
    root_plain = strip_emoji(root_display)

    if is_spirit:
        if "7 agreements" in because.lower() or "fruits of" in because.lower():
            return (
                f"{topic_lower} with the root of {root_display}; "
                f"is happening because of 7 agreements AND because FRUITS of "
                f"{extract_spirit_fruits(because)}"
            ).strip()
        return f"{topic_lower} with the root of {root_display}; {because}"

    if because.lower().startswith("happening because"):
        return f"{topic_lower} with the root of {root_display}; {because}"
    if "agreements because of" in because.lower():
        return because
    if "because of agreements" in because.lower():
        return f"{topic_lower} with the root of {root_display}; {because}"
    if "because of 7 agreements" in because.lower():
        return f"{topic_lower} with the root of {root_display}; is happening {because.lower()}"
    return f"{topic_lower} with the root of {root_display}; is happening because of agreements, blood covenants, blood contracts, hexes, vexes, interaction with the blood, and satanic ritual agreements {because.lower().lstrip('because ')}"


def extract_spirit_fruits(because: str) -> str:
    m = re.search(r"(?i)(?:fruits of|because of)\s+(.+)$", because)
    if not m:
        return inject_fruit_emojis(
            "🟨 Sexual Corruption of Human and Hybrid DNA, 🟩 Counterfeit Spirituality (think KUNDALINI), and ⬛ Confusing Preferences with Stewardship"
        )
    blob = m.group(1).strip().rstrip(".")
    return inject_fruit_emojis(blob)


def parse_presentation(path: Path) -> list[dict]:
    entries = []
    current_day = None
    pending_topic = None
    pending_root = ""

    def flush():
        nonlocal pending_topic, pending_root
        if pending_topic:
            entries.append(
                {
                    "day": current_day,
                    "topic_line": pending_topic,
                    "root": pending_root,
                    "because": "",
                }
            )
        pending_topic = None
        pending_root = ""

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if re.match(r"(?i)^DAY\s+\d+", line):
            flush()
            current_day = int(re.search(r"\d+", line).group())
            continue

        if re.match(r"(?i)^(because|happening because|is happening because)", line):
            because = line
            if pending_topic:
                phrase = extract_topic_phrase(pending_topic)
                root = pending_root or extract_root_from_line(pending_topic)[0]
                entries.append(
                    {
                        "day": current_day,
                        "topic_line": pending_topic,
                        "phrase": phrase,
                        "root": root,
                        "because": normalize_because_line(because),
                    }
                )
                pending_topic = None
                pending_root = ""
            elif entries and not entries[-1].get("because"):
                entries[-1]["because"] = normalize_because_line(because)
            continue

        if re.match(r"(?i)^is happening", line):
            if entries and not entries[-1].get("because"):
                entries[-1]["because"] = normalize_because_line(line)
            continue

        flush()
        pending_topic = line
        pending_root = extract_root_from_line(line)[0]

    flush()
    for e in entries:
        if "phrase" not in e:
            e["phrase"] = extract_topic_phrase(e.get("topic_line", ""))
    return [e for e in entries if e.get("phrase")]


def match_topic_number(phrase: str, chart: dict[int, str]) -> int | None:
    key = slug(phrase)
    if not key:
        return None

    best = None
    best_score = 0
    for num, name in chart.items():
        name_key = slug(name)
        if key == name_key:
            return num
        if key in name_key or name_key in key:
            score = min(len(key), len(name_key))
            if score > best_score:
                best_score = score
                best = num
    return best


def header_line(num: int, chart_name: str, root_display: str, phrase: str) -> str:
    is_spirit = num >= 574 or "spirit" in phrase.lower()[:20]
    if is_spirit:
        topic = phrase.lower()
        if not topic.startswith("interacting"):
            topic = f"interacting with the {topic}" if not topic.startswith("spirit") else f"interacting with the {topic}"
        return f"{num:03d}. {topic}, from a root of {root_display}."
    name = chart_name.lower()
    return f"{num:03d}. {name}, from a root of {root_display}."


def main():
    presentation = Path(
        sys.argv[1]
        if len(sys.argv) > 1
        else Path.home() / "Downloads/Telegram Desktop/TOPICS 666 PRESENTATION.txt"
    )
    chart_file = Path(
        sys.argv[2]
        if len(sys.argv) > 2
        else Path(__file__).resolve().parent.parent / "data/ROOT-SPIRITS-CHART.txt"
    )
    fallback = Path(
        sys.argv[3]
        if len(sys.argv) > 3
        else Path.home() / "Downloads/Telegram Desktop/topics 666.txt"
    )
    output = Path(
        sys.argv[4]
        if len(sys.argv) > 4
        else Path.home() / "Downloads/Telegram Desktop/topics 666.txt"
    )

    chart = load_chart(chart_file)
    existing = parse_existing_topics(fallback)
    presentation_entries = parse_presentation(presentation)

    by_number: dict[int, dict] = {}
    unmatched = []

    for entry in presentation_entries:
        num = match_topic_number(entry["phrase"], chart)
        if not num:
            unmatched.append(entry["phrase"])
            continue
        root = entry["root"] or extract_root_from_line(entry.get("topic_line", ""))[0]
        if root and not EMOJI_RE.search(root):
            em = root_emoji(root)
            if em:
                root = f"{em} {strip_emoji(root)}"
        by_number[num] = {
            "phrase": entry["phrase"],
            "root": root,
            "because": entry.get("because", ""),
        }

    blocks = []
    for num in range(1, 667):
        chart_name = chart.get(num, f"Topic {num}")
        if num in by_number:
            meta = by_number[num]
            root = meta["root"] or strip_emoji(existing.get(num, {}).get("header", "").split("from a root of")[-1].split(".")[0])
            if root and not EMOJI_RE.search(root):
                em = root_emoji(root)
                root = f"{em} {strip_emoji(root)}".strip() if em else root
            is_spirit = num >= 574
            header = header_line(num, chart_name, root, meta["phrase"])
            because = meta["because"]
            if not because and num in existing:
                because = existing[num]["detail"]
            because = inject_fruit_emojis(inject_root_emoji(because))
            topic_display = meta["phrase"]
            detail = build_detail_line(topic_display, root, because, is_spirit)
        elif num in existing:
            header = inject_root_emoji(existing[num]["header"])
            detail = inject_fruit_emojis(inject_root_emoji(existing[num]["detail"]))
        else:
            header = f"{num:03d}. {chart_name.lower()}, from a root of unknown."
            detail = ""

        block = f"{header}\n\n{detail}\n~~~~~~~~~~~~\n"
        blocks.append(block)

    output.write_text("\n\n".join(blocks), encoding="utf-8")
    print(f"Wrote {output} ({len(by_number)} topics from presentation, {667 - len(by_number)} from fallback)")
    if unmatched:
        print(f"Unmatched phrases ({len(unmatched)}):")
        for p in unmatched[:20]:
            print(f"  - {p}")
        if len(unmatched) > 20:
            print(f"  ... and {len(unmatched) - 20} more")


if __name__ == "__main__":
    main()
