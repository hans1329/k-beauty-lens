# YouTube Data Collection & Analysis Strategy

## Overview
This document outlines the strategy for collecting and analyzing YouTube creator data using the YouTube Data API v3, with a focus on K-beauty content creators.

---

## 1. YouTube Data API v3 - Data Collection Points

### 1.1 Channel Data
- **Channel ID**: Unique identifier for the channel
- **Title**: Channel name
- **Description**: Channel description and bio
- **Country**: Creator's country/region
- **Language**: Primary content language
- **Upload Frequency**: Video posting cadence
- **Category**: Content category classification
- **Subscriber Count**: Total subscribers
- **Total Views**: Cumulative channel views
- **Video Count**: Total number of videos

**API Endpoint**: `channels.list`
```
GET https://www.googleapis.com/youtube/v3/channels
?part=snippet,statistics,contentDetails
&id={CHANNEL_ID}
&key={API_KEY}
```

### 1.2 Video Data
- **Video ID**: Unique identifier
- **Title**: Video title
- **Description**: Video description
- **Tags**: Associated keywords/tags
- **Duration**: Video length
- **Published At**: Upload date and time
- **View Count**: Total views
- **Like Count**: Total likes
- **Comment Count**: Total comments
- **Thumbnail URL**: Video thumbnail image URL (default, medium, high, standard, maxres)

**API Endpoint**: `videos.list`
```
GET https://www.googleapis.com/youtube/v3/videos
?part=snippet,contentDetails,statistics
&id={VIDEO_ID}
&key={API_KEY}
```

### 1.3 Caption/Subtitle Data
- **Auto-generated Captions**: Automatic speech-to-text captions
- **Manual Captions**: Creator-uploaded subtitles
- **Language**: Caption language
- **Track Kind**: Caption type (standard, ASR)

**API Endpoint**: `captions.list`
```
GET https://www.googleapis.com/youtube/v3/captions
?part=snippet
&videoId={VIDEO_ID}
&key={API_KEY}
```

**Note**: Downloading caption content requires OAuth 2.0 authentication and video owner permission.

### 1.4 Comment Data
- **Top N Comments**: Most relevant or popular comments
- **Comment Text**: Full comment content
- **Like Count**: Comment engagement
- **Reply Count**: Number of replies
- **Author**: Commenter information

**API Endpoint**: `commentThreads.list`
```
GET https://www.googleapis.com/youtube/v3/commentThreads
?part=snippet,replies
&videoId={VIDEO_ID}
&order=relevance
&maxResults={N}
&key={API_KEY}
```

**Analysis Focus**: Extract brand mentions, product names, and beauty-related keywords (ingredient effectiveness, product recommendations, etc.)

---

## 2. Text-First Analysis Strategy

### 2.1 Named Entity Recognition (NER)
Extract structured entities from titles, descriptions, captions, and comments:

#### Brand Names
- Korean brands: 에뛰드, 이니스프리, 라네즈, 설화수, 더페이스샵, etc.
- International brands: MAC, NARS, Fenty Beauty, Charlotte Tilbury, etc.

#### Product Names
- Specific product lines and SKUs
- Product categories: foundation, cushion, lipstick, serum, etc.

#### Ingredients
- Active ingredients: niacinamide, retinol, hyaluronic acid, centella asiatica, etc.
- Natural extracts: green tea, propolis, rice, snail mucin, etc.

### 2.2 Beauty Keyword Extraction

#### Product Categories
- Base: cushion, foundation, primer, BB cream, CC cream
- Color: lipstick, tint, blush, eyeshadow, highlighter
- Skincare: toner, essence, serum, cream, mask pack

#### Beauty Concepts
- Skin tone: 쿨톤 (cool tone), 웜톤 (warm tone), 뉴트럴 (neutral)
- Finish: dewy, matte, semi-matte, satin, glowy
- Coverage: light, medium, full
- Style: natural, glam, no-makeup makeup, MLBB (My Lips But Better)

#### Trends & Concerns
- 비건 (vegan), cruelty-free, clean beauty
- 민감성 (sensitive skin), 여드름 (acne), 건성 (dry skin)
- K-beauty, glass skin, 물광 (moisture glow)

#### Application Techniques
- Tutorial terms: 그라데이션 (gradient), 블렌딩 (blending), 컨투어링 (contouring)
- Tools: brush, sponge, puff, finger application

### 2.3 Text Processing Pipeline
```
Raw Text Input
    ↓
Tokenization & Normalization
    ↓
NER (Brand/Product/Ingredient)
    ↓
Keyword Extraction (Beauty Terms)
    ↓
Sentiment Analysis (Optional)
    ↓
Structured Database Storage
```

---

## 3. Minimal Image Collection Strategy

### 3.1 Thumbnail Collection
- **Source**: YouTube Data API provides thumbnail URLs directly
- **Legal**: Thumbnails are publicly accessible via API (no copyright issues)
- **Resolution Levels**:
  - Default: 120x90
  - Medium: 320x180
  - High: 480x360
  - Standard: 640x480
  - Maxres: 1280x720 (if available)

**Recommendation**: Collect `high` or `standard` resolution for analysis balance between quality and storage.

### 3.2 Visual Analysis Goals

#### Lighting & Tone Analysis
- **Brightness**: Overall luminosity level
- **Contrast**: Dynamic range between light and dark
- **Color Temperature**: Warm vs. cool lighting
- **White Balance**: Accuracy of neutral tones

**Tools**: OpenCV, PIL (Python Imaging Library)
```python
# Example: Extract average brightness
import cv2
import numpy as np

image = cv2.imread('thumbnail.jpg')
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
brightness = np.mean(gray)
```

#### Color Palette Extraction
- **Dominant Colors**: Top 5-10 most prominent colors
- **Color Distribution**: Percentage of each color
- **Harmony Analysis**: Color scheme (monochromatic, complementary, analogous)

**Tools**: ColorThief, sklearn KMeans clustering
```python
# Example: Extract dominant colors
from colorthief import ColorThief

color_thief = ColorThief('thumbnail.jpg')
palette = color_thief.get_palette(color_count=6, quality=1)
# Returns: [(R, G, B), (R, G, B), ...]
```

#### Style Classification
- **Visual Aesthetics**: Minimalist, vibrant, pastel, bold, natural
- **Composition**: Close-up, product shot, person-focused, flat lay
- **Background**: Studio, outdoor, lifestyle, textured

### 3.3 Storage Strategy
- **Original Thumbnails**: Store URL references only (save storage)
- **Analysis Results**: Store extracted metrics in database
  - Brightness score
  - Contrast ratio
  - Dominant color palette (hex codes)
  - Color temperature (kelvin estimate)
  - Style tags

**Database Schema Example**:
```sql
CREATE TABLE video_thumbnails (
  video_id VARCHAR(20) PRIMARY KEY,
  thumbnail_url TEXT,
  brightness FLOAT,
  contrast FLOAT,
  color_temp INT, -- Kelvin
  dominant_colors JSON, -- Array of hex colors
  style_tags JSON, -- Array of style keywords
  analyzed_at TIMESTAMP
);
```

---

## 4. Implementation Considerations

### 4.1 API Quota Management
- YouTube Data API has daily quota limits (10,000 units/day by default)
- Cost per operation:
  - `videos.list`: 1 unit
  - `channels.list`: 1 unit
  - `commentThreads.list`: 1 unit
  - `captions.list`: 50 units

**Strategy**: Prioritize text data collection (low cost) over caption downloads (high cost)

### 4.2 Data Refresh Schedule
- **Channel Stats**: Weekly update
- **Video Stats**: Daily for recent videos, weekly for older content
- **Comments**: On-demand or event-driven (trending videos)
- **Thumbnails**: One-time collection per video

### 4.3 Privacy & Compliance
- Only collect publicly available data
- Respect YouTube Terms of Service
- Do not scrape or cache video content itself
- Use official API endpoints only

---

## 5. Analysis Output Examples

### Example 1: Creator Profile
```json
{
  "channel_id": "UC1234567890",
  "name": "Beauty Creator A",
  "subscribers": 500000,
  "avg_views": 150000,
  "engagement_rate": 4.8,
  "top_brands": ["Etude House", "Laneige", "COSRX"],
  "style_keywords": ["natural", "MLBB", "dewy"],
  "skin_tone_focus": "cool tone",
  "thumbnail_style": {
    "avg_brightness": 180,
    "dominant_colors": ["#FFE5E5", "#FFC0CB", "#D4A5A5"],
    "aesthetic": "soft pastel"
  }
}
```

### Example 2: Video Analysis
```json
{
  "video_id": "dQw4w9WgXcQ",
  "title": "Perfect Daily Makeup Tutorial | MLBB Look",
  "views": 250000,
  "engagement": 5.2,
  "brands_mentioned": [
    {"name": "Etude House", "product": "Double Lasting Foundation"},
    {"name": "Peripera", "product": "Ink Velvet Tint"}
  ],
  "keywords": ["MLBB", "daily makeup", "natural", "dewy"],
  "thumbnail_colors": ["#FFD1DC", "#FFA07A", "#E6B8AF"],
  "top_comments": [
    "What's the lipstick shade?",
    "This look is so natural!",
    "Peripera tint is amazing"
  ]
}
```

---

## 6. Next Steps

1. **Set up YouTube Data API credentials**
2. **Build data collection pipeline** (Python/Node.js)
3. **Implement NER & keyword extraction** (spaCy, BERT-based models)
4. **Develop image analysis module** (OpenCV, ColorThief)
5. **Create database schema** (PostgreSQL/Supabase)
6. **Build analytics dashboard** (React + charts)

---

## References
- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [API Quota Calculator](https://developers.google.com/youtube/v3/determine_quota_cost)
- [YouTube Terms of Service](https://www.youtube.com/static?template=terms)
