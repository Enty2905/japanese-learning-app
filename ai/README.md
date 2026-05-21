# Japanese Handwriting AI

Python project for training a Japanese handwriting recognition model and serving it through an upload API. The first training scope is Hiragana and Katakana, with Kanji N5/N4/N3 expansion paths.

## Folder Layout

```text
japanese-learning-app/
  backend/
  frontend/
  ai/
    data/
      raw/
        hiragana/
          hiragana_a/
          hiragana_i/
          ...
        katakana/
          katakana_a/
          katakana_i/
          ...
        n5/
          kanji_u4e00/
          kanji_u4e8c/
          ...
        n4/
          kanji_u529b/
          kanji_u5915/
          ...
        n3/
          kanji_u653f/
          kanji_u8b70/
          ...
      processed/
    models/
      japanese_handwriting_kana_kanji_n3_v1.pt
    src/japanese_handwriting_ai/
```

Put training images into `data/raw/<group>/<label_name>/`. Each label folder should contain images for one character class. The starter label set contains the 46 base hiragana and 46 base katakana classes. Kanji labels use Unicode codepoint folder names such as `kanji_u4e00` for `一`, because one Kanji can have multiple readings.

This monorepo tracks only the inference model used by the web app: `models/japanese_handwriting_kana_kanji_n3_v1.pt`. Training datasets, logs, generated reports, virtual environments, and extra checkpoints are intentionally ignored.

Current raw groups:

- `data/raw/hiragana/`
- `data/raw/katakana/`
- `data/raw/n5/`
- `data/raw/n4/`
- `data/raw/n3/`

## Setup

```powershell
cd C:\6-HK6\DACN\japanese-learning-app\ai
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -e .
```

## Create Label Folders

```powershell
python -m japanese_handwriting_ai.create_label_folders --root data/raw
```

Create Kanji N5 folders only:

```powershell
python -m japanese_handwriting_ai.create_label_folders --root data/raw --label-groups kanji_n5
```

Create Kanji N4 folders only:

```powershell
python -m japanese_handwriting_ai.create_label_folders --root data/raw --label-groups kanji_n4
```

Create Kanji N3 folders only:

```powershell
python -m japanese_handwriting_ai.create_label_folders --root data/raw --label-groups kanji_n3
```

## Training Data

You do not have to manually create every image yourself, but the model should be trained on real handwriting data before it is used in production.

Recommended sources:

- ETL Character Database: official Japanese character recognition research dataset. Useful subsets for this first phase are ETL4/ETL7 for hiragana and ETL5/ETL6 for katakana.
- Kaggle handwriting datasets: easier to start with, but always check license and quality before using them in a real product.
- Your own app/user samples: best for final accuracy because the data will match the camera, paper, pen, lighting, and handwriting style of your users.

Synthetic generated images can help bootstrap the project, but they should not be the only training data. Font-rendered characters and AI-generated handwriting often look cleaner than real user handwriting, so a model trained only on synthetic data can fail on real uploads.

### Download and Convert ETL

Read the ETL terms on the official download page first. Then run:

```powershell
python scripts/prepare_etl_dataset.py --datasets ETL4 ETL5 --agree-to-terms
```

Default behavior:

- Downloads ETL archives into `data/raw/etl/`.
- Extracts them under `data/raw/etl/<dataset>/`.
- Converts supported base Hiragana/Katakana samples into the training folders under `data/raw/<group>/<label>/`.
- Writes a CSV manifest to `data/processed/etl_kana_v1/manifest.csv`.

For a quick pipeline test without converting every sample:

```powershell
python scripts/prepare_etl_dataset.py --datasets ETL4 ETL5 --agree-to-terms --limit-per-class 50
```

If the ETL archives were already downloaded and extracted:

```powershell
python scripts/prepare_etl_dataset.py --datasets ETL4 ETL5 --skip-download
```

### Download and Convert ETL Kanji N5

For Kanji N5, prefer ETL8G first. It is handwritten, includes 881 educational Kanji, has 1,600 writers, and is much smaller than ETL9G. ETL9G is larger and covers 2,965 JIS level-1 Kanji with 4,000 writers, but it is a much bigger download.

After reading and accepting the ETL terms, convert only the project Kanji N5 labels:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/prepare_etl_dataset.py --datasets ETL8G --label-groups kanji_n5 --agree-to-terms --manifest data/processed/etl_kanji_n5_v1/manifest.csv
```

If ETL8G is already downloaded/extracted:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/prepare_etl_dataset.py --datasets ETL8G --label-groups kanji_n5 --skip-download --manifest data/processed/etl_kanji_n5_v1/manifest.csv
```

Optional broader source:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/prepare_etl_dataset.py --datasets ETL9G --label-groups kanji_n5 --agree-to-terms --manifest data/processed/etl9g_kanji_n5_v1/manifest.csv
```

The converter writes Kanji images into `data/raw/n5/kanji_uXXXX/`.

### Download and Convert ETL Kanji N4

The project keeps a stable local N4 reference list. Because there is no single official modern JLPT N4 Kanji list, this is treated as a project label policy. The source-style N4 list has 162 characters; 21 already exist in this project's N5 set, so `kanji_n4` adds 141 new labels. Use `kanji_n4_with_n5` for N5 + N4 Kanji, or `all_with_kanji_n4` for kana + N5 + N4.

After reading and accepting the ETL terms, convert the N4 labels:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/prepare_etl_dataset.py --datasets ETL8G --label-groups kanji_n4 --agree-to-terms --manifest data/processed/etl_kanji_n4_v1/manifest.csv
```

If ETL8G is already downloaded/extracted:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/prepare_etl_dataset.py --datasets ETL8G --label-groups kanji_n4 --skip-download --manifest data/processed/etl_kanji_n4_v1/manifest.csv
```

If a target N4 character is missing from ETL8G or you want a broader source, convert from ETL9G:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/prepare_etl_dataset.py --datasets ETL9G --label-groups kanji_n4 --agree-to-terms --manifest data/processed/etl9g_kanji_n4_v1/manifest.csv
```

The converter writes Kanji N4 images into `data/raw/n4/kanji_uXXXX/`.
On the current local ETL8G conversion, 140 of 141 N4 classes have real ETL samples. `映` (`kanji_u6620`) needs ETL9G or user-provided samples for real handwriting coverage; synthetic samples can keep the pipeline runnable but should not be treated as production evidence.

### Download and Convert ETL Kanji N3

The project keeps a stable local N3 reference list. Because there is no single official modern JLPT N3 Kanji list, this is treated as a project label policy. The source-style N3 list has 370 characters; 2 already exist in this project's N5/N4 set, so `kanji_n3` adds 368 new labels. Use `kanji_n3_with_n5_n4` or `kanji_n5_n4_n3` for 612 total beginner/intermediate Kanji labels, or `all_with_kanji_n3` for kana + N5 + N4 + N3.

After reading and accepting the ETL terms, convert the N3 labels:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/prepare_etl_dataset.py --datasets ETL8G --label-groups kanji_n3 --agree-to-terms --manifest data/processed/etl_kanji_n3_v1/manifest.csv
```

If ETL8G is already downloaded/extracted:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/prepare_etl_dataset.py --datasets ETL8G --label-groups kanji_n3 --skip-download --manifest data/processed/etl_kanji_n3_v1/manifest.csv
```

If a target N3 character is missing from ETL8G or you want a broader source, convert from ETL9G:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/prepare_etl_dataset.py --datasets ETL9G --label-groups kanji_n3 --agree-to-terms --manifest data/processed/etl9g_kanji_n3_v1/manifest.csv
```

The converter writes Kanji N3 images into `data/raw/n3/kanji_uXXXX/`.
On the current local ETL8G conversion, 284 of 368 N3 classes have real ETL samples. The remaining 84 N3 classes need ETL9G or user-provided samples for real handwriting coverage; synthetic samples can keep the pipeline runnable but should not be treated as production evidence.

## Generate Synthetic Robustness Data

ETL is useful, but it is too clean compared with screenshots, camera photos, grid paper, and app images. Generate synthetic kana samples with Japanese fonts, light grid backgrounds, blur, rotation, and noise:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/generate_synthetic_dataset.py --samples-per-class 30 --overwrite
```

This writes images like `synthetic_0000.png` into every `data/raw/<group>/<label>/` folder.

Generate only Kanji N5 bootstrap samples:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/generate_synthetic_dataset.py --label-groups kanji_n5 --samples-per-class 30 --overwrite
```

Synthetic Kanji is useful for checking the pipeline and warming up the classifier, but it is not enough to prove real handwriting quality. Add real handwritten Kanji N5 samples into the same `data/raw/n5/kanji_uXXXX/` folders before judging accuracy.

Generate only Kanji N4 bootstrap samples:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/generate_synthetic_dataset.py --label-groups kanji_n4 --samples-per-class 30 --overwrite
```

Synthetic N4 samples are useful for smoke tests, but production quality still needs real handwritten ETL/user samples in `data/raw/n4/kanji_uXXXX/`.

Generate only Kanji N3 bootstrap samples:

```powershell
$env:PYTHONPATH="src"
py -3.13 scripts/generate_synthetic_dataset.py --label-groups kanji_n3 --samples-per-class 30 --overwrite
```

Synthetic N3 samples are useful for smoke tests, but production quality still needs real handwritten ETL/user samples in `data/raw/n3/kanji_uXXXX/`.

## Add Kanji N5 Recognition

There is no single official modern JLPT N5 Kanji list, so this project keeps a stable local list:

- `kanji_n5_core`: 81 common pre-2010/core N5 Kanji.
- `kanji_n5_extended_only`: 22 extra beginner Kanji often included in newer 100-class N5 lists.
- `kanji_n5`: core + extended, 103 Kanji total.

Train only Kanji N5 as a separate classifier:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --label-groups kanji_n5 --epochs 10 --batch-size 128 --init-from models/japanese_handwriting_full_v2.pt --output models/japanese_kanji_n5_v1.pt
```

Current local ETL8G Kanji N5 checkpoint after 1 CPU epoch:

```text
model=models/japanese_kanji_n5_etl8g_v1.pt
classes=103
top1=0.9850
top3=0.9964
top5=0.9968
```

Train one unified model that recognizes the current kana set plus Kanji N5:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --label-groups all_with_kanji_n5 --epochs 10 --batch-size 128 --init-from models/japanese_handwriting_full_v2.pt --output models/japanese_handwriting_kana_kanji_n5_v1.pt
```

Use `--init-from` when adding Kanji to reuse the existing kana checkpoint's feature extractor. Use `--resume` only when continuing a checkpoint with the exact same class list.

## Add Kanji N4 Recognition

Kanji N4 is now wired into the same label, dataset, training, evaluation, prediction, and API pipeline:

- `kanji_n4`: 141 N4 labels that are not already in the local N5 set.
- `kanji_n4_with_n5` or `kanji_n5_n4`: 244 total beginner Kanji labels.
- `all_with_kanji_n4`: 46 Hiragana + 46 Katakana + N5 + N4, 336 classes total.

Train only the newly added N4 Kanji:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --label-groups kanji_n4 --epochs 10 --batch-size 128 --init-from models/japanese_handwriting_kana_kanji_n5_v1.pt --output models/japanese_kanji_n4_v1.pt
```

Train one unified model that recognizes kana + Kanji N5 + Kanji N4:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --label-groups all_with_kanji_n4 --epochs 10 --batch-size 128 --init-from models/japanese_handwriting_kana_kanji_n5_v1.pt --output models/japanese_handwriting_kana_kanji_n4_v1.pt
```

Evaluate the unified N4-expanded checkpoint:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.evaluate --model models/japanese_handwriting_kana_kanji_n4_v1.pt --data-dir data/raw --batch-size 128 --split val
```

## Add Kanji N3 Recognition

Kanji N3 is wired into the same label, dataset, training, evaluation, prediction, text OCR, and API pipeline:

- `kanji_n3`: 368 N3 labels that are not already in the local N5/N4 set.
- `kanji_n3_with_n5_n4` or `kanji_n5_n4_n3`: 612 total beginner/intermediate Kanji labels.
- `all_with_kanji_n3`: 46 Hiragana + 46 Katakana + N5 + N4 + N3, 704 classes total.

Train only the newly added N3 Kanji:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --label-groups kanji_n3 --epochs 10 --batch-size 128 --init-from models/japanese_handwriting_kana_kanji_n4_v1.pt --output models/japanese_kanji_n3_v1.pt
```

Train one unified model that recognizes kana + Kanji N5 + Kanji N4 + Kanji N3:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --label-groups all_with_kanji_n3 --epochs 10 --batch-size 128 --init-from models/japanese_handwriting_kana_kanji_n4_v1.pt --output models/japanese_handwriting_kana_kanji_n3_v1.pt
```

Evaluate the unified N3-expanded checkpoint:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.evaluate --model models/japanese_handwriting_kana_kanji_n3_v1.pt --data-dir data/raw --batch-size 128 --split val
```

Current local ETL8G + synthetic unified N3 checkpoint after 1 CPU epoch:

```text
model=models/japanese_handwriting_kana_kanji_n3_v1.pt
classes=704
val_samples=17453
top1=0.9895
top3=0.9972
top5=0.9979
```

## Train Full 92-Class Model

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --epochs 10 --batch-size 128 --output models/japanese_handwriting_full_v2.pt
```

Continue training later:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --epochs 5 --batch-size 128 --resume models/japanese_handwriting_full_v2.pt --output models/japanese_handwriting_full_v2.pt
```

The current pipeline trains all 46 basic hiragana + 46 basic katakana classes by default. Add `--label-groups all_with_kanji_n5` for the unified kana + Kanji N5 classifier, `--label-groups all_with_kanji_n4` for kana + Kanji N5 + Kanji N4, or `--label-groups all_with_kanji_n3` for kana + Kanji N5 + Kanji N4 + Kanji N3. It uses robust crop/pad preprocessing, stronger augmentation, stratified validation split, and class-balanced loss.

If your dataset uses white ink on a black background, pass `--invert`. Keep the same preprocessing for prediction because it is saved inside the checkpoint.

### Laptop-Friendly Debug Training

Use Python 3.13 on this machine because dependencies were installed there:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --epochs 1 --batch-size 64 --output models/debug_full.pt
```

For a quick subset smoke test, train by kana row. This is only for debugging. Do not use row checkpoints as the final AI because they only recognize the selected row.

```powershell
# Hiragana + Katakana: a i u e o
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --label-groups row_a --epochs 5 --batch-size 64 --output models/debug_row_a.pt

# Continue the same row later for 5 more epochs
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --label-groups row_a --epochs 5 --batch-size 64 --resume models/debug_row_a.pt --output models/debug_row_a.pt

# Hiragana only: a i u e o
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --label-groups hiragana_row_a --epochs 5 --batch-size 64 --output models/debug_hiragana_row_a.pt

# Next row: ka ki ku ke ko
py -3.13 -m japanese_handwriting_ai.train --data-dir data/raw --label-groups row_k --epochs 5 --batch-size 64 --output models/debug_row_k.pt
```

Available row groups: `row_a`, `row_k`, `row_s`, `row_t`, `row_n`, `row_h`, `row_m`, `row_y`, `row_r`, `row_w`.

Prefix with `hiragana_` or `katakana_` to train one script only, for example `hiragana_row_s` or `katakana_row_t`.

## Predict One Image

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.predict --model models/japanese_handwriting_kana_kanji_n3_v1.pt --image path\to\image.png --top-k 5 --tta
```

`--tta` averages small rotated versions of the image. It is slower but usually better for real-world uploaded photos/screenshots.

## Extract Text From a Sentence Image

This is a segmentation-based MVP for horizontal, clearly separated Japanese handwriting. It first splits the image into lines and character boxes, then runs the trained character classifier on each crop. It upscales small images and can handle simple punctuation such as `ー` and `:` heuristically. It is useful for testing clean practice-sheet images, but it is not a full OCR sequence model yet.

Known limits:

- Small kana, dakuten/handakuten, and most punctuation are not trained classes yet.
- Very cursive handwriting, touching characters, vertical text, skewed camera photos, and complex backgrounds need a real sequence OCR model later.

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.extract_text --model models/japanese_handwriting_kana_kanji_n3_v1.pt --image path\to\sentence.png --top-k 3
```

For noisy sentence images, raise the confidence threshold so low-confidence crops are skipped:

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.extract_text --model models/japanese_handwriting_kana_kanji_n3_v1.pt --image path\to\sentence.png --top-k 3 --min-confidence 0.45
```

API endpoint:

```http
POST /predict/text?top_k=3&min_confidence=0.35
Content-Type: multipart/form-data
file=<image>
```

The browser UI includes a confidence slider and debug box overlay. Green boxes are accepted characters, amber boxes are skipped by the confidence threshold, and red boxes are filtered as segmentation noise.

## Evaluate

```powershell
$env:PYTHONPATH="src"
py -3.13 -m japanese_handwriting_ai.evaluate --model models/japanese_handwriting_full_v2.pt --data-dir data/raw --batch-size 128 --split val
```

Current local checkpoint after 3 CPU epochs:

```text
classes=92
top1=0.9765
top3=0.9971
top5=0.9982
```

This is validation on the local ETL + synthetic dataset. For production quality, keep adding real user/camera samples and retrain.

## Run Upload API

```powershell
cd C:\6-HK6\DACN\japanese-learning-app\ai
$env:JAPANESE_HANDWRITING_MODEL_PATH="models/japanese_handwriting_kana_kanji_n3_v1.pt"
uvicorn japanese_handwriting_ai.api:app --host 0.0.0.0 --port 8001
```

If `uvicorn` is not on PATH on this machine, run it through Python:

```powershell
$env:PYTHONPATH="src"
$env:JAPANESE_HANDWRITING_MODEL_PATH="models/japanese_handwriting_kana_kanji_n3_v1.pt"
py -3.13 -m uvicorn japanese_handwriting_ai.api:app --host 127.0.0.1 --port 8001
```

Open the browser UI:

```text
http://127.0.0.1:8001
```

Request:

```powershell
curl.exe -F "file=@path\to\image.png" http://localhost:8001/predict
```

Response:

```json
{
  "label": "hiragana_a",
  "confidence": 0.98,
  "predictions": [
    {"label": "hiragana_a", "confidence": 0.98}
  ]
}
```

## Notes

- This repository does not include a dataset. You need real handwritten Hiragana/Katakana/Kanji images before training for production use.
- For better accuracy, keep the train data balanced across labels and capture images under conditions similar to your app users.
- The API is intentionally standalone so your Node backend can call it as a separate internal service.
