# Flyers

Recruitment flyers for the league. Not published to the website.

| File | Size | Use |
|---|---|---|
| `facebook-4x5.png` | 912x1140 | Facebook feed. 4:5 so it shows in full without cropping |
| `print-letter.png` | 912x1168 | Original artwork with the QR code embedded |

The QR code points to https://tricountyslopitch.ca and is verified to decode.

## Printing at 8.5x11

Not kept in the repo because it is 8MB and adds no detail. Regenerate it with:

```bash
convert print-letter.png -filter Lanczos -resize 300% -unsharp 0x1+0.6+0.02 \
  -density 300 -units PixelsPerInch print-letter-upscaled.png
```

## Printing

The artwork is 912px wide, which is about 107 DPI at 8.5x11. That is soft for
print. It is 228 DPI at 4x6 and 166 DPI at 5x7, so smaller sizes look sharper.
Print at 4x6 or 5x7 where possible.

## Remaking these

The art was generated with Nano Banana Pro, which exports at 1K through the
consumer app. The text, colours and layout were specified in the prompt; the
QR code was generated separately and composited in, because generated QR codes
do not scan.

Palette used: navy #0F264F, mid blue #214B6E, gold #C1A25D.

Wording on the flyer: PLAYERS WANTED / TRI-COUNTY SLO-PITCH LEAGUE /
SUNDAY MORNINGS - MAY TO AUGUST / KITCHENER & WATERLOO DIAMONDS /
ALL SKILL LEVELS WELCOME / TRICOUNTYSLOPITCH.CA

No price is shown on the flyer. That is deliberate.
