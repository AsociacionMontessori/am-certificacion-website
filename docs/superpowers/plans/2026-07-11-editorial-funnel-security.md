# Editorial Funnel and Secret-Safe Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preparar `/home/carlos/montessori-blog-automation` para clasificar artículos, insertar enlaces comerciales controlados y notificar la decisión sin volver a filtrar secretos.

**Architecture:** Gemini devuelve dos enums dentro del JSON que ya genera; un router Python determinista resuelve rutas y UTM. BeautifulSoup inserta como máximo los elementos permitidos, y una bandera apagada por defecto permite desplegar el código antes de que existan las landing pages. Un formatter central redacta secretos incluso dentro de excepciones HTTP.

**Tech Stack:** Python 3.10+, standard-library `unittest`, BeautifulSoup 4, httpx, Jinja2, WordPress REST API, Telegram Bot API.

## Global Constraints

- Repositorio de trabajo: `/home/carlos/montessori-blog-automation`.
- Mantener Python 3.10+ y no añadir un framework de pruebas; usar `python -m unittest`.
- La salida del modelo solo puede usar `nido`, `casa`, `taller`, `cosmica`, `neuro`, `general_training`, `editorial` y `high`, `medium`, `low`.
- El modelo no recibe autoridad para construir URLs.
- Los artículos siguen creándose como borradores de WordPress.
- `CONVERSION_CTA_ENABLED` debe permanecer apagado hasta que las 15 landing pages estén en producción.
- Relevancia alta: enlace contextual + bloque final + WhatsApp secundario.
- Relevancia media: un enlace contextual y ningún bloque final.
- Relevancia baja o salida inválida: ningún enlace comercial.
- No registrar tokens, contraseñas, mensajes personales ni contenido de `.env`.
- Un fallo de notificación no cambia el resultado del pipeline.

---

### Task 1: Redact Secrets and Cover Rotated Logs

**Files:**
- Create: `/home/carlos/montessori-blog-automation/logging_security.py`
- Create: `/home/carlos/montessori-blog-automation/tests/__init__.py`
- Create: `/home/carlos/montessori-blog-automation/tests/test_logging_security.py`
- Modify: `/home/carlos/montessori-blog-automation/config.py:300-314`
- Modify: `/home/carlos/montessori-blog-automation/.gitignore:1-8`

**Interfaces:**
- Produces: `redact_text(value: object) -> str`.
- Produces: `RedactingFormatter(logging.Formatter)`.
- Consumed by: `config.setup_logging()` and all existing loggers through root handlers.

- [ ] **Step 1: Write the failing redaction tests**

```python
# tests/test_logging_security.py
import logging
import unittest

from logging_security import RedactingFormatter, redact_text


class LoggingSecurityTests(unittest.TestCase):
    def test_redacts_telegram_token_inside_url(self):
        raw = "POST https://api.telegram.org/bot123456:ABC_secret/sendMessage"
        clean = redact_text(raw)
        self.assertNotIn("123456:ABC_secret", clean)
        self.assertIn("bot[REDACTED]/sendMessage", clean)

    def test_redacts_named_secret_assignment(self):
        clean = redact_text(
            "WP_APP_PASSWORD=abcd efgh ijkl mnop qrst uvwx\nstatus=failed"
        )
        self.assertEqual(clean, "WP_APP_PASSWORD=[REDACTED]\nstatus=failed")

    def test_formatter_redacts_exception_text(self):
        formatter = RedactingFormatter("%(levelname)s %(message)s")
        try:
            raise RuntimeError(
                "https://api.telegram.org/bot999999:XYZ/sendMessage failed"
            )
        except RuntimeError:
            record = logging.LogRecord(
                "test", logging.ERROR, __file__, 1, "notification failed", (),
                exc_info=__import__("sys").exc_info(),
            )
        rendered = formatter.format(record)
        self.assertNotIn("999999:XYZ", rendered)
        self.assertIn("[REDACTED]", rendered)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests and verify the missing module failure**

Run:

```bash
python -m unittest tests.test_logging_security -v
```

Expected: `ModuleNotFoundError: No module named 'logging_security'`.

- [ ] **Step 3: Implement the redacting formatter**

```python
# logging_security.py
"""Redact credentials from every rendered log record."""

from __future__ import annotations

import logging
import re


_TELEGRAM_URL = re.compile(r"(https://api\.telegram\.org/bot)[^/\s]+", re.I)
_NAMED_SECRET = re.compile(
    r"(?i)\b(TELEGRAM_BOT_TOKEN|WP_APP_PASSWORD|GEMINI_API_KEY|"
    r"BRAVE_SEARCH_API_KEY|GOOGLE_CSE_KEY)\s*[:=]\s*[^\r\n]+"
)


def redact_text(value: object) -> str:
    text = str(value)
    text = _TELEGRAM_URL.sub(r"\1[REDACTED]", text)
    return _NAMED_SECRET.sub(lambda match: f"{match.group(1)}=[REDACTED]", text)


class RedactingFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        return redact_text(super().format(record))
```

- [ ] **Step 4: Wire the formatter and quiet URL-level HTTP logs**

Replace `setup_logging()` in `config.py` with:

```python
def setup_logging() -> None:
    from logging.handlers import RotatingFileHandler
    from logging_security import RedactingFormatter

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    formatter = RedactingFormatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
    file_handler = RotatingFileHandler(
        LOG_DIR / "automation.log",
        maxBytes=5 * 1024 * 1024,
        backupCount=3,
        encoding="utf-8",
    )
    stream_handler = logging.StreamHandler()
    file_handler.setFormatter(formatter)
    stream_handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(logging.INFO)
    root.addHandler(file_handler)
    root.addHandler(stream_handler)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
```

Change `.gitignore` line 6 from `logs/*.log` to:

```gitignore
logs/
```

- [ ] **Step 5: Purge the local copies containing the revoked token**

```bash
find logs -type f -delete
git status --short
```

Expected: `logs/` no longer appears as untracked; `.env` remains ignored.

- [ ] **Step 6: Run security tests and scan tracked files**

```bash
python -m unittest tests.test_logging_security -v
! git grep -nE 'api\.telegram\.org/bot[0-9]{6,}:[A-Za-z0-9_-]{20,}' -- .
```

Expected: three tests pass; `git grep` returns no secret value. A literal variable name in `config.py` is acceptable, but no assignment with a value is present.

- [ ] **Step 7: Commit**

```bash
git add .gitignore config.py logging_security.py tests/__init__.py tests/test_logging_security.py
git commit -m "fix(security): redact credentials from automation logs"
```

---

### Task 2: Add the Closed Classification Contract

**Files:**
- Modify: `/home/carlos/montessori-blog-automation/content.py:19-69,467-566`
- Modify: `/home/carlos/montessori-blog-automation/templates/post_prompt.txt:39-96`
- Modify: `/home/carlos/montessori-blog-automation/templates/cuadernillo_prompt.txt:34-86`
- Create: `/home/carlos/montessori-blog-automation/tests/test_content_conversion_contract.py`

**Interfaces:**
- Produces constants: `CONVERSION_INTENTS: frozenset[str]`, `COMMERCIAL_RELEVANCE_LEVELS: frozenset[str]`.
- Extends `GeneratedPost` with `conversion_intent: str` and `commercial_relevance: str`.
- Later tasks consume only these normalized fields, never raw model URLs.

- [ ] **Step 1: Write failing normalization tests**

```python
# tests/test_content_conversion_contract.py
import unittest

from content import (
    COMMERCIAL_RELEVANCE_LEVELS,
    CONVERSION_INTENTS,
    _normalize_generated_post,
)


def generated_payload(**overrides):
    payload = {
        "title": "Observación en Casa de Niños",
        "body": "<h2>Observación Montessori</h2><p>" + "palabra " * 700 + "</p>",
        "excerpt": "Cómo observar y acompañar el ambiente Montessori.",
        "categories": ["Educación Montessori"],
        "tags": ["observación", "Montessori"],
        "seo_title": "Observación en Casa de Niños",
        "seo_description": "Observación en Casa de Niños para acompañar el aprendizaje.",
        "focus_keyphrase": "observación Montessori",
        "og_title": "Observación en Casa de Niños",
        "og_description": "Una mirada práctica a la observación Montessori.",
        "twitter_title": "Observación en Casa de Niños",
        "twitter_description": "Una mirada práctica a la observación Montessori.",
        "social_image_source": "featured_media",
        "image_prompt": "Editorial Montessori classroom photograph",
        "image_alt_text": "Guía observando un ambiente Montessori",
        "conversion_intent": "casa",
        "commercial_relevance": "medium",
    }
    payload.update(overrides)
    return payload


class ContentConversionContractTests(unittest.TestCase):
    def test_preserves_valid_enum_values(self):
        post = _normalize_generated_post(generated_payload())
        self.assertEqual(post.conversion_intent, "casa")
        self.assertEqual(post.commercial_relevance, "medium")

    def test_invalid_values_fall_back_to_no_promotion(self):
        post = _normalize_generated_post(
            generated_payload(
                conversion_intent="https://invented.example/program",
                commercial_relevance="urgent",
            )
        )
        self.assertEqual(post.conversion_intent, "editorial")
        self.assertEqual(post.commercial_relevance, "low")

    def test_every_declared_enum_value_normalizes_without_expansion(self):
        for intent in CONVERSION_INTENTS:
            relevance = "low" if intent == "editorial" else "medium"
            with self.subTest(intent=intent):
                post = _normalize_generated_post(
                    generated_payload(
                        conversion_intent=intent,
                        commercial_relevance=relevance,
                    )
                )
                self.assertEqual(post.conversion_intent, intent)
                self.assertEqual(post.commercial_relevance, relevance)
        for relevance in COMMERCIAL_RELEVANCE_LEVELS:
            with self.subTest(relevance=relevance):
                post = _normalize_generated_post(
                    generated_payload(commercial_relevance=relevance)
                )
                self.assertEqual(post.commercial_relevance, relevance)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Verify the dataclass failure**

```bash
python -m unittest tests.test_content_conversion_contract -v
```

Expected: failure because `GeneratedPost` has no conversion fields.

- [ ] **Step 3: Extend the schema and normalize defensively**

Add near `POST_SCHEMA`:

```python
CONVERSION_INTENTS = frozenset(
    {"nido", "casa", "taller", "cosmica", "neuro", "general_training", "editorial"}
)
COMMERCIAL_RELEVANCE_LEVELS = frozenset({"high", "medium", "low"})
```

Add both names to `POST_SCHEMA["required"]` and add these properties:

```python
"conversion_intent": {
    "type": "string",
    "enum": sorted(CONVERSION_INTENTS),
},
"commercial_relevance": {
    "type": "string",
    "enum": sorted(COMMERCIAL_RELEVANCE_LEVELS),
},
```

Add fields at the end of `GeneratedPost`:

```python
conversion_intent: str
commercial_relevance: str
```

Before constructing `GeneratedPost`, normalize:

```python
conversion_intent = str(data.get("conversion_intent", "editorial")).strip().lower()
commercial_relevance = str(data.get("commercial_relevance", "low")).strip().lower()
if conversion_intent not in CONVERSION_INTENTS:
    conversion_intent = "editorial"
    commercial_relevance = "low"
if commercial_relevance not in COMMERCIAL_RELEVANCE_LEVELS:
    commercial_relevance = "low"
if conversion_intent == "editorial":
    commercial_relevance = "low"
```

Pass both normalized values into the `GeneratedPost(...)` constructor.

- [ ] **Step 4: Give both prompts exact classification rules**

Insert before `## Formato de respuesta` in both templates:

```text
## Clasificación comercial controlada
Devuelve dos campos de clasificación; NO escribas CTA ni inventes enlaces dentro del body.

`conversion_intent` debe ser exactamente uno de:
- `nido`: Nido o Comunidad Infantil.
- `casa`: Casa de Niños.
- `taller`: Taller I o II, primaria Montessori o segundo plano de desarrollo.
- `cosmica`: Educación Cósmica o Grandes Lecciones.
- `neuro`: neuroeducación, neurociencia educativa o desarrollo cerebral.
- `general_training`: formación, certificación o trabajo profesional como Guía Montessori sin nivel específico.
- `editorial`: crianza, noticias, vida familiar o educación general sin relación clara con una formación anterior.

`commercial_relevance` debe ser exactamente uno de:
- `high`: el propósito central ayuda a decidir estudiar, certificarse o trabajar como Guía.
- `medium`: el tema corresponde a un programa, pero el artículo es principalmente pedagógico.
- `low`: no existe una relación comercial natural.

Ante duda usa `editorial` y `low`.
```

Add to each JSON example:

```json
"conversion_intent": "editorial",
"commercial_relevance": "low"
```

- [ ] **Step 5: Run tests**

```bash
python -m unittest tests.test_content_conversion_contract -v
```

Expected: three tests pass, including every value in both closed enum sets.

- [ ] **Step 6: Commit**

```bash
git add content.py templates/post_prompt.txt templates/cuadernillo_prompt.txt tests/test_content_conversion_contract.py
git commit -m "feat(editorial): classify training intent with closed enums"
```

---

### Task 3: Build the Deterministic Router and HTML Inserter

**Files:**
- Create: `/home/carlos/montessori-blog-automation/conversion_funnel.py`
- Create: `/home/carlos/montessori-blog-automation/tests/test_conversion_funnel.py`
- Modify: `/home/carlos/montessori-blog-automation/config.py:38-143,227-297`

**Interfaces:**
- Produces: `ConversionDecision` dataclass.
- Produces: `build_source_content_id(post_slug: str) -> str`, exactamente `post_` más los primeros 16 caracteres hexadecimales minúsculos del SHA-256 sobre bytes UTF-8.
- Produces: `resolve_conversion_decision(intent: str, relevance: str, post_slug: str, post_title: str) -> ConversionDecision`.
- Produces: `strip_uncontrolled_commercial_links(html: str) -> tuple[str, int]`.
- Produces: `apply_conversion_funnel(html: str, decision: ConversionDecision) -> tuple[str, dict[str, object]]`.
- Consumes config: `CONVERSION_CTA_ENABLED`, `CERTIFICATION_SITE_URL`, `WHATSAPP_PHONE`.

- [ ] **Step 1: Write failing routing and insertion tests**

```python
# tests/test_conversion_funnel.py
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from bs4 import BeautifulSoup

from conversion_funnel import (
    apply_conversion_funnel,
    resolve_conversion_decision,
    strip_uncontrolled_commercial_links,
)


ARTICLE = "<p>Introducción editorial.</p><p>Casa de Niños y observación.</p><h2>Práctica</h2>"


class ConversionFunnelTests(unittest.TestCase):
    def test_routes_only_known_intent_with_attribution(self):
        decision = resolve_conversion_decision(
            "casa", "medium", "observacion-casa", "Observación en Casa"
        )
        self.assertEqual(decision.destination_path, "/diplomados/casa-de-ninos/")
        query = parse_qs(urlparse(decision.attributed_url).query)
        self.assertEqual(query["utm_source"], ["montessorimexico.org"])
        self.assertEqual(query["utm_medium"], ["referral"])
        self.assertEqual(query["utm_campaign"], ["guia_montessori"])
        self.assertEqual(query["utm_content"], ["post_d95119f319861cea"])
        self.assertNotIn("observacion-casa", decision.attributed_url)
        self.assertEqual(query["utm_term"], ["casa"])

    def test_general_training_routes_to_the_hub(self):
        decision = resolve_conversion_decision(
            "general_training", "high", "ser-guia", "Cómo ser Guía Montessori"
        )
        self.assertEqual(decision.program_id, "general_training")
        self.assertEqual(decision.destination_path, "/diplomados/")

    def test_medium_adds_one_contextual_link_and_no_cta_block(self):
        decision = resolve_conversion_decision(
            "casa", "medium", "observacion-casa", "Observación en Casa"
        )
        with patch("config.CONVERSION_CTA_ENABLED", True):
            html, stats = apply_conversion_funnel(ARTICLE, decision)
        soup = BeautifulSoup(html, "html.parser")
        self.assertEqual(len(soup.select("a.ammac-training-link")), 1)
        self.assertEqual(len(soup.select("section.ammac-training-cta")), 0)
        self.assertEqual(stats["cta_level"], "medium")

    def test_high_adds_context_link_and_single_final_block(self):
        decision = resolve_conversion_decision(
            "casa", "high", "ser-guia-casa", "Cómo ser Guía de Casa"
        )
        with patch("config.CONVERSION_CTA_ENABLED", True):
            html, _ = apply_conversion_funnel(ARTICLE, decision)
        soup = BeautifulSoup(html, "html.parser")
        self.assertEqual(len(soup.select("a.ammac-training-link")), 1)
        self.assertEqual(len(soup.select("section.ammac-training-cta")), 1)
        self.assertEqual(len(soup.select("section.ammac-training-cta a")), 2)

    def test_low_relevance_changes_nothing_even_when_enabled(self):
        with patch("config.CONVERSION_CTA_ENABLED", True):
            decision = resolve_conversion_decision("casa", "low", "post", "Post")
            html, stats = apply_conversion_funnel(ARTICLE, decision)
        self.assertEqual(html, ARTICLE)
        self.assertEqual(stats["cta_level"], "none")

    def test_invalid_intent_changes_nothing_even_when_enabled(self):
        with patch("config.CONVERSION_CTA_ENABLED", True):
            decision = resolve_conversion_decision("invented", "high", "post", "Post")
            html, stats = apply_conversion_funnel(ARTICLE, decision)
        self.assertEqual(html, ARTICLE)
        self.assertEqual(stats["cta_level"], "none")

    def test_disabled_flag_changes_nothing_for_a_valid_decision(self):
        with patch("config.CONVERSION_CTA_ENABLED", False):
            decision = resolve_conversion_decision("casa", "high", "post", "Post")
            html, stats = apply_conversion_funnel(ARTICLE, decision)
        self.assertEqual(html, ARTICLE)
        self.assertEqual(stats["cta_level"], "none")

    def test_strips_only_uncontrolled_commercial_links(self):
        html = (
            '<p><a href="https://certificacionmontessori.com/inventado/">Inventado</a> '
            '<a href="https://fuente.example/articulo">Fuente</a></p>'
        )
        cleaned, removed = strip_uncontrolled_commercial_links(html)
        soup = BeautifulSoup(cleaned, "html.parser")
        self.assertEqual(removed, 1)
        self.assertEqual(len(soup.select("a")), 1)
        self.assertEqual(soup.a["href"], "https://fuente.example/articulo")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Verify the missing module failure**

```bash
python -m unittest tests.test_conversion_funnel -v
```

Expected: `ModuleNotFoundError: No module named 'conversion_funnel'`.

- [ ] **Step 3: Add safe configuration defaults**

Add in `config.py`:

```python
CONVERSION_CTA_ENABLED = os.environ.get("CONVERSION_CTA_ENABLED", "0") == "1"
CERTIFICATION_SITE_URL = os.environ.get(
    "CERTIFICATION_SITE_URL", "https://certificacionmontessori.com"
).rstrip("/")
WHATSAPP_PHONE = os.environ.get("WHATSAPP_PHONE", "5215548885013").strip()
```

Add validation inside `validate()`:

```python
parsed_certification = urlparse(CERTIFICATION_SITE_URL)
if (
    parsed_certification.scheme != "https"
    or parsed_certification.hostname != "certificacionmontessori.com"
    or parsed_certification.username
    or parsed_certification.password
    or parsed_certification.port
    or parsed_certification.path not in {"", "/"}
    or parsed_certification.params
    or parsed_certification.query
    or parsed_certification.fragment
):
    logging.critical(
        "CERTIFICATION_SITE_URL debe ser exactamente https://certificacionmontessori.com"
    )
    sys.exit(1)
if not WHATSAPP_PHONE.isdigit():
    logging.critical("WHATSAPP_PHONE debe contener solo dígitos")
    sys.exit(1)
```

- [ ] **Step 4: Implement the complete deterministic module**

```python
# conversion_funnel.py
"""Controlled article-to-training routing and HTML enrichment."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from urllib.parse import urlencode, urlparse

from bs4 import BeautifulSoup

import config


ROUTES = {
    "nido": ("nido", "/diplomados/nido-comunidad-infantil/", "Nido y Comunidad Infantil"),
    "casa": ("casa", "/diplomados/casa-de-ninos/", "Casa de Niños"),
    "taller": ("taller", "/diplomados/taller-i-ii/", "Taller I y II"),
    "cosmica": ("cosmica", "/diplomados/educacion-cosmica/", "Educación Cósmica"),
    "neuro": ("neuro", "/diplomados/neuroeducacion/", "Neuroeducación"),
    "general_training": ("general_training", "/diplomados/", "formación como Guía Montessori"),
}

CONTEXT_COPY = (
    (
        "Si deseas profundizar profesionalmente en este tema, ",
        "consulta la formación en {label}",
        " de la Asociación Montessori de México.",
    ),
    (
        "Para llevar este tema a una preparación profesional, revisa ",
        "el programa de {label}",
        " de la Asociación Montessori de México.",
    ),
    (
        "Quienes busquen una ruta formativa relacionada pueden conocer ",
        "la propuesta de {label}",
        " de la Asociación Montessori de México.",
    ),
)


@dataclass(frozen=True)
class ConversionDecision:
    intent: str
    relevance: str
    program_id: str
    destination_path: str
    destination_url: str
    attributed_url: str
    label: str
    post_slug: str
    post_title: str
    cta_level: str


def build_source_content_id(post_slug: str) -> str:
    digest = hashlib.sha256(post_slug.encode("utf-8")).hexdigest()
    return f"post_{digest[:16]}"


def resolve_conversion_decision(
    intent: str,
    relevance: str,
    post_slug: str,
    post_title: str,
) -> ConversionDecision:
    clean_intent = str(intent or "").strip().lower()
    clean_relevance = str(relevance or "").strip().lower()
    route = ROUTES.get(clean_intent)
    if route is None or clean_relevance not in {"high", "medium"}:
        return ConversionDecision(
            intent="editorial",
            relevance="low",
            program_id="",
            destination_path="",
            destination_url="",
            attributed_url="",
            label="",
            post_slug=post_slug,
            post_title=post_title,
            cta_level="none",
        )

    program_id, path, label = route
    destination_url = f"{config.CERTIFICATION_SITE_URL}{path}"
    query = urlencode(
        {
            "utm_source": "montessorimexico.org",
            "utm_medium": "referral",
            "utm_campaign": "guia_montessori",
            "utm_content": build_source_content_id(post_slug),
            "utm_term": clean_intent,
        }
    )
    return ConversionDecision(
        intent=clean_intent,
        relevance=clean_relevance,
        program_id=program_id,
        destination_path=path,
        destination_url=destination_url,
        attributed_url=f"{destination_url}?{query}",
        label=label,
        post_slug=post_slug,
        post_title=post_title,
        cta_level=clean_relevance,
    )


def _contextual_paragraph(soup: BeautifulSoup, decision: ConversionDecision):
    digest = hashlib.sha256(
        f"{decision.intent}:{decision.post_slug}".encode("utf-8")
    ).digest()
    prefix, anchor_copy, suffix = CONTEXT_COPY[digest[0] % len(CONTEXT_COPY)]
    paragraph = soup.new_tag("p")
    paragraph["class"] = ["ammac-training-context"]
    paragraph.append(prefix)
    link = soup.new_tag("a", href=decision.attributed_url)
    link["class"] = ["ammac-training-link"]
    link["data-program-id"] = decision.program_id
    link["data-cta-position"] = "contextual"
    link.string = anchor_copy.format(label=decision.label)
    paragraph.append(link)
    paragraph.append(suffix)
    return paragraph


def strip_uncontrolled_commercial_links(html: str) -> tuple[str, int]:
    """Remove model-authored links to the commercial host while preserving text."""
    soup = BeautifulSoup(html or "", "html.parser")
    allowed_host = urlparse(config.CERTIFICATION_SITE_URL).hostname
    removed = 0
    for anchor in soup.find_all("a", href=True):
        try:
            host = urlparse(str(anchor.get("href") or "").strip()).hostname
        except ValueError:
            host = None
        if host in {allowed_host, f"www.{allowed_host}"}:
            anchor.unwrap()
            removed += 1
    return str(soup), removed


def _final_cta(soup: BeautifulSoup, decision: ConversionDecision):
    section = soup.new_tag("section")
    section["class"] = ["ammac-training-cta"]
    section["aria-label"] = "Formación Montessori relacionada"

    heading = soup.new_tag("h2")
    heading.string = f"Da el siguiente paso en {decision.label}"
    section.append(heading)

    body = soup.new_tag("p")
    body.string = (
        "Conoce la modalidad en línea, duración, acompañamiento y proceso de "
        "inscripción de este programa de AMMAC."
    )
    section.append(body)

    primary = soup.new_tag("a", href=decision.attributed_url)
    primary["class"] = ["ammac-training-cta-primary"]
    primary["data-program-id"] = decision.program_id
    primary["data-cta-position"] = "final"
    primary.string = "Conocer el programa"
    section.append(primary)

    message = (
        f"Hola, me interesa {decision.label}. Llegué desde el artículo "
        f"«{decision.post_title}». ¿Me pueden orientar?"
    )
    whatsapp = soup.new_tag(
        "a",
        href=(
            f"https://wa.me/{config.WHATSAPP_PHONE}?"
            f"{urlencode({'text': message})}"
        ),
    )
    whatsapp["class"] = ["ammac-training-cta-whatsapp"]
    whatsapp["data-program-id"] = decision.program_id
    whatsapp["data-cta-position"] = "final_whatsapp"
    whatsapp.string = "Preguntar por WhatsApp"
    section.append(whatsapp)
    return section


def apply_conversion_funnel(
    html: str,
    decision: ConversionDecision,
) -> tuple[str, dict[str, object]]:
    if not config.CONVERSION_CTA_ENABLED or decision.cta_level == "none":
        return html, {"cta_level": "none", "contextual_links": 0, "final_blocks": 0}

    soup = BeautifulSoup(html or "", "html.parser")
    if soup.select_one(".ammac-training-link, .ammac-training-cta"):
        return str(soup), {
            "cta_level": decision.cta_level,
            "contextual_links": len(soup.select("a.ammac-training-link")),
            "final_blocks": len(soup.select("section.ammac-training-cta")),
        }

    contextual = _contextual_paragraph(soup, decision)
    paragraphs = soup.find_all("p")
    if len(paragraphs) >= 2:
        paragraphs[1].insert_after(contextual)
    elif paragraphs:
        paragraphs[0].insert_after(contextual)
    else:
        soup.insert(0, contextual)

    final_blocks = 0
    if decision.cta_level == "high":
        soup.append(_final_cta(soup, decision))
        final_blocks = 1

    return str(soup), {
        "cta_level": decision.cta_level,
        "contextual_links": 1,
        "final_blocks": final_blocks,
    }
```

- [ ] **Step 5: Run router tests**

```bash
python -m unittest tests.test_conversion_funnel -v
```

Expected: eight tests pass; all UTM fields, hub routing, high/medium/low, invalid input, disabled insertion and uncontrolled-URL removal are covered.

- [ ] **Step 6: Commit**

```bash
git add config.py conversion_funnel.py tests/test_conversion_funnel.py
git commit -m "feat(editorial): add controlled conversion routing"
```

---

### Task 4: Reject Excessively Similar Titles

**Files:**
- Create: `/home/carlos/montessori-blog-automation/quality_gate.py`
- Create: `/home/carlos/montessori-blog-automation/tests/test_quality_gate.py`
- Modify: `/home/carlos/montessori-blog-automation/config.py:38-143,273-297`

**Interfaces:**
- Produces: `TitleQualityResult(accepted: bool, highest_similarity: float, matched_title: str)`.
- Produces: `check_title_novelty(candidate: str, existing_titles: list[str], threshold: float) -> TitleQualityResult`.
- Consumed by both pipeline runners before image generation or WordPress writes.

- [ ] **Step 1: Write failing quality tests**

```python
# tests/test_quality_gate.py
import unittest

from quality_gate import check_title_novelty


class QualityGateTests(unittest.TestCase):
    def test_rejects_near_duplicate_title(self):
        result = check_title_novelty(
            "Constructivismo y aprendizaje activo para familias",
            ["Constructivismo y Aprendizaje Activo: claves para familias"],
            0.82,
        )
        self.assertFalse(result.accepted)
        self.assertGreaterEqual(result.highest_similarity, 0.82)

    def test_accepts_distinct_title(self):
        result = check_title_novelty(
            "El silencio como preparación del ambiente",
            ["Matemáticas Montessori: pensar con las manos"],
            0.82,
        )
        self.assertTrue(result.accepted)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Verify the missing module failure**

```bash
python -m unittest tests.test_quality_gate -v
```

Expected: missing `quality_gate` module.

- [ ] **Step 3: Implement deterministic similarity**

```python
# quality_gate.py
"""Conservative title novelty gate for recent WordPress content."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from difflib import SequenceMatcher


_STOPWORDS = {
    "a", "al", "como", "con", "de", "del", "el", "en", "la", "las",
    "los", "para", "por", "un", "una", "y",
}


@dataclass(frozen=True)
class TitleQualityResult:
    accepted: bool
    highest_similarity: float
    matched_title: str


def _normalize(value: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode()
    return " ".join(re.findall(r"[a-z0-9]+", ascii_text.lower()))


def _tokens(value: str) -> set[str]:
    return {token for token in _normalize(value).split() if token not in _STOPWORDS}


def _similarity(left: str, right: str) -> float:
    left_normalized = _normalize(left)
    right_normalized = _normalize(right)
    sequence = SequenceMatcher(None, left_normalized, right_normalized).ratio()
    left_tokens = _tokens(left)
    right_tokens = _tokens(right)
    union = left_tokens | right_tokens
    jaccard = len(left_tokens & right_tokens) / len(union) if union else 0.0
    return max(sequence, jaccard)


def check_title_novelty(
    candidate: str,
    existing_titles: list[str],
    threshold: float,
) -> TitleQualityResult:
    best_score = 0.0
    best_title = ""
    for title in existing_titles:
        score = _similarity(candidate, title)
        if score > best_score:
            best_score = score
            best_title = title
    return TitleQualityResult(best_score < threshold, best_score, best_title)
```

Add config:

```python
QUALITY_RECENT_POSTS_COUNT = int(os.environ.get("QUALITY_RECENT_POSTS_COUNT", "30"))
TITLE_SIMILARITY_MAX = float(os.environ.get("TITLE_SIMILARITY_MAX", "0.82"))
```

Validate that count is between `1` and `100`, and similarity is greater than `0` and less than `1`.

- [ ] **Step 4: Run tests and configuration validation**

```bash
python -m unittest tests.test_quality_gate -v
python config.py
```

Expected: two tests pass and configuration reports valid without printing secret values.

- [ ] **Step 5: Commit**

```bash
git add config.py quality_gate.py tests/test_quality_gate.py
git commit -m "feat(editorial): block near-duplicate post titles"
```

---

### Task 5: Integrate Decisions into Both Draft Pipelines and Telegram

**Files:**
- Modify: `/home/carlos/montessori-blog-automation/main.py:107-119,122-316`
- Modify: `/home/carlos/montessori-blog-automation/run_cuadernillos.py:24-149`
- Modify: `/home/carlos/montessori-blog-automation/notifier.py:14-114`
- Modify: `/home/carlos/montessori-blog-automation/wordpress.py:138-142,479-512`
- Create: `/home/carlos/montessori-blog-automation/tests/test_notifier_conversion.py`
- Create: `/home/carlos/montessori-blog-automation/tests/test_wordpress_slug.py`
- Modify: `/home/carlos/montessori-blog-automation/README.md:46-105,237-258`

**Interfaces:**
- Consumes: `resolve_conversion_decision`, `strip_uncontrolled_commercial_links`, `apply_conversion_funnel`, `check_title_novelty`, `build_post_slug`.
- Extends: `notify_draft_created(..., conversion_intent: str, commercial_relevance: str, destination_url: str)`.
- Produces logs with decision metadata but no secret or user data.

- [ ] **Step 1: Write a failing notification message test**

```python
# tests/test_notifier_conversion.py
import unittest

from unittest.mock import patch

from notifier import _build_message, _post_json


class NotifierConversionTests(unittest.TestCase):
    def test_message_includes_controlled_decision(self):
        message = _build_message(
            post_id=42,
            title="Observación Montessori",
            topic_name="Casa de Niños",
            author_name="Roxana Muñoz",
            edit_url="https://montessorimexico.org/wp-admin/post.php?post=42&action=edit",
            truseo_score=82,
            headline_score=76,
            conversion_intent="casa",
            commercial_relevance="medium",
            destination_url="https://certificacionmontessori.com/diplomados/casa-de-ninos/",
        )
        self.assertIn("Conversión: casa / medium", message)
        self.assertIn("Destino: https://certificacionmontessori.com/diplomados/casa-de-ninos/", message)
        self.assertNotIn("TELEGRAM_BOT_TOKEN", message)

    @patch("notifier.time.sleep")
    @patch("notifier.httpx.Client")
    def test_http_notification_retries_three_times(self, client_class, sleep):
        client = client_class.return_value.__enter__.return_value
        client.post.side_effect = RuntimeError("temporary failure")
        self.assertFalse(_post_json("https://hooks.example.test/event", {"ok": True}))
        self.assertEqual(client.post.call_count, 3)
        self.assertEqual(sleep.call_count, 2)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Verify the signature failure**

```bash
python -m unittest tests.test_notifier_conversion -v
```

Expected: `_build_message()` rejects the new keyword arguments.

- [ ] **Step 3: Extend notifier signatures and payload**

Add `import time`, then add this shared non-blocking sender:

```python
def _post_json(url: str, payload: dict, attempts: int = 3) -> bool:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            with httpx.Client(timeout=20) as client:
                response = client.post(url, json=payload)
                response.raise_for_status()
            return True
        except Exception as exc:
            last_error = exc
            if attempt < attempts - 1:
                time.sleep(2 ** attempt)
    logger.warning("Falló notificación HTTP después de %d intentos: %s", attempts, last_error)
    return False
```

Change `_send_webhook()` and `_send_telegram()` to build their current payloads and return `_post_json(url, payload)`. Keep success logs in those wrappers and never log a full authenticated URL.

Add required arguments with safe string defaults to `_build_message()` and `notify_draft_created()`:

```python
conversion_intent: str = "editorial",
commercial_relevance: str = "low",
destination_url: str = "",
```

Append message lines:

```python
lines.append(f"Conversión: {conversion_intent} / {commercial_relevance}")
if destination_url:
    lines.append(f"Destino: {destination_url}")
```

Add the same three fields to the webhook payload. Do not add article body, Telegram token, chat ID or WhatsApp message.

- [ ] **Step 4: Integrate novelty and funnel in `main.py`**

Add imports:

```python
from conversion_funnel import (
    apply_conversion_funnel,
    resolve_conversion_decision,
    strip_uncontrolled_commercial_links,
)
from quality_gate import check_title_novelty
```

Immediately after `post.categories` is assigned, fetch one list and apply the gate:

```python
recent_for_quality = list_recent_published_posts(limit=config.QUALITY_RECENT_POSTS_COUNT)
quality = check_title_novelty(
    post.title,
    [item.get("title", "") for item in recent_for_quality],
    config.TITLE_SIMILARITY_MAX,
)
if not quality.accepted:
    logger.warning(
        "Quality gate: título demasiado similar (%.3f) a '%s'",
        quality.highest_similarity,
        quality.matched_title,
    )
    state.mark_processed(
        article.url,
        title=post.title,
        score=score,
        status="quality_failed",
        topic_id=topic.topic_id,
    )
    return False

post_slug = build_post_slug(post)
decision = resolve_conversion_decision(
    post.conversion_intent,
    post.commercial_relevance,
    post_slug,
    post.title,
)
post.body, stripped_commercial_links = strip_uncontrolled_commercial_links(post.body)
logger.info(
    "Higiene comercial [%s]: enlaces no controlados eliminados=%d",
    topic.topic_id,
    stripped_commercial_links,
)
```

Reuse `recent_for_quality[:config.RECENT_POSTS_GALLERY_COUNT]` for the gallery. After `sanitize_and_enrich_body(...)`, call:

```python
post.body, conversion_stats = apply_conversion_funnel(post.body, decision)
logger.info(
    "Conversión [%s]: intent=%s relevance=%s destination=%s stats=%s enabled=%s",
    topic.topic_id,
    decision.intent,
    decision.relevance,
    decision.destination_path or "none",
    conversion_stats,
    config.CONVERSION_CTA_ENABLED,
)
```

Import `urlparse` from `urllib.parse`. Replace the helper with:

```python
def _pick_preferred_external_url(excluded_hosts: set[str] | None = None) -> str:
    excluded = {host.lower() for host in (excluded_hosts or set())}
    links = [
        url for url in config.PREFERRED_EXTERNAL_LINKS
        if url and (urlparse(url).netloc or "").lower() not in excluded
    ]
    every = config.PREFERRED_EXTERNAL_LINK_EVERY
    if not links or every <= 0:
        return ""
    published_count = state.count_processed_by_status(statuses=("published_draft",))
    next_publication_number = published_count + 1
    if next_publication_number % every != 0:
        return ""
    rotation_index = (next_publication_number // every - 1) % len(links)
    return links[rotation_index]
```

Call it with:

```python
certification_host = (urlparse(config.CERTIFICATION_SITE_URL).netloc or "").lower()
excluded_hosts = {certification_host} if decision.destination_path else set()
preferred_external_url = _pick_preferred_external_url(excluded_hosts)
```

Pass the three decision fields to `notify_draft_created()`.

- [ ] **Step 5: Apply the same contract to `run_cuadernillos.py`**

Add these imports and place the following exact block after `post.categories` is assigned:

```python
from conversion_funnel import (
    apply_conversion_funnel,
    resolve_conversion_decision,
    strip_uncontrolled_commercial_links,
)
from quality_gate import check_title_novelty
```

```python
recent_for_quality = list_recent_published_posts(limit=config.QUALITY_RECENT_POSTS_COUNT)
quality = check_title_novelty(
    post.title,
    [recent.get("title", "") for recent in recent_for_quality],
    config.TITLE_SIMILARITY_MAX,
)
if not quality.accepted:
    logger.warning(
        "Quality gate cuadernillo: título demasiado similar (%.3f) a '%s'",
        quality.highest_similarity,
        quality.matched_title,
    )
    if not dry_run:
        state.mark_processed(
            item.pseudo_url,
            title=post.title,
            status="cuad_quality_failed",
            topic_id=item.topic_id,
        )
    return False

decision = resolve_conversion_decision(
    post.conversion_intent,
    post.commercial_relevance,
    build_post_slug(post),
    post.title,
)
post.body, stripped_commercial_links = strip_uncontrolled_commercial_links(post.body)
logger.info(
    "Higiene comercial cuadernillo: enlaces no controlados eliminados=%d",
    stripped_commercial_links,
)
recent_posts = recent_for_quality[:config.RECENT_POSTS_GALLERY_COUNT]
post.body, _ = sanitize_and_enrich_body(
    html=post.body,
    source_url="",
    recent_posts=recent_posts,
)
post.body, conversion_stats = apply_conversion_funnel(post.body, decision)
logger.info(
    "Conversión cuadernillo: intent=%s relevance=%s destination=%s stats=%s enabled=%s",
    decision.intent,
    decision.relevance,
    decision.destination_path or "none",
    conversion_stats,
    config.CONVERSION_CTA_ENABLED,
)
```

Remove the older gallery-only block at lines 79-86. Pass `conversion_intent`, `commercial_relevance` and `destination_url` to Telegram exactly as in `main.py`.

For a dry run, log the decision and rendered conversion stats but do not mark state or call WordPress.

- [ ] **Step 6: Make future WordPress permalinks concise and consistent**

Write this test first:

```python
# tests/test_wordpress_slug.py
import unittest
from types import SimpleNamespace

from wordpress import build_post_slug


class WordPressSlugTests(unittest.TestCase):
    def test_uses_editorial_title_not_branded_seo_title(self):
        post = SimpleNamespace(
            title="Observación en Casa de Niños",
            seo_title="Observación en Casa de Niños | Asociación Montessori de México",
        )
        self.assertEqual(build_post_slug(post), "observacion-en-casa-de-ninos")


if __name__ == "__main__":
    unittest.main()
```

Run `python -m unittest tests.test_wordpress_slug -v` and confirm the missing export. Add to `wordpress.py`:

```python
def build_post_slug(post: GeneratedPost) -> str:
    return _slugify(post.title)
```

Change the `create_draft()` payload to `"slug": build_post_slug(post)`. Import `build_post_slug` in both runners; use it for the conversion decision and every `analyze_truseo(..., slug=...)` call, then remove the now-unused `build_slug` imports from `seo_rules`. Do not rewrite any already-published permalink.

- [ ] **Step 7: Document the feature flag and safe activation**

Add these variables to `README.md`:

```text
- `CONVERSION_CTA_ENABLED`: `0` keeps classification and logs active without inserting controlled CTA; commercial-link hygiene still removes model-authored destinations. Switch to `1` only after all program URLs return 200.
- `CERTIFICATION_SITE_URL`: canonical HTTPS origin for controlled program routes.
- `WHATSAPP_PHONE`: institutional WhatsApp digits only, without `+` or spaces.
- `QUALITY_RECENT_POSTS_COUNT`: recent WordPress titles compared by the novelty gate (default `30`).
- `TITLE_SIMILARITY_MAX`: maximum accepted title similarity before rejecting the draft (default `0.82`).
```

Document the intent routing table and state that draft creation never calls IndexNow.

- [ ] **Step 8: Run the complete local suite**

```bash
python -m unittest discover -s tests -v
CONVERSION_CTA_ENABLED=0 DRY_RUN=1 python config.py
```

Expected: all tests pass; configuration is valid; no URL or token is printed from `.env`.

- [ ] **Step 9: Run one safe pipeline sample**

```bash
DRY_RUN=1 ./run.sh
python run_cuadernillos.py --limit 1 --dry-run
```

Expected: both runs log normalized intent/relevance and `enabled=False`; no WordPress post is created and no body receives a live CTA.

- [ ] **Step 10: Commit**

```bash
git add main.py run_cuadernillos.py notifier.py wordpress.py README.md tests/test_notifier_conversion.py tests/test_wordpress_slug.py
git commit -m "feat(editorial): prepare measured training funnel for drafts"
```

## Plan Completion Gate

Run:

```bash
python -m unittest discover -s tests -v
git status --short
! git grep -nE 'api\.telegram\.org/bot[0-9]{6,}:[A-Za-z0-9_-]{20,}' -- .
```

Expected:

- all tests pass;
- working tree contains no unexpected files;
- no secret value appears;
- `CONVERSION_CTA_ENABLED` defaults to `0`;
- one invalid enum test proves the no-promotion fallback;
- no IndexNow code runs from either draft runner.
