# Flyers and social assets

Artwork for the league. None of this is published to the website.

| File | Size | Use |
|---|---|---|
| `facebook-cover.png` | 1680x640 | Facebook page cover photo |
| `facebook-4x5.png` | 912x1140 | Facebook feed post. 4:5 so it shows in full without cropping |
| `print-letter.png` | 912x1168 | Print, with the QR code embedded |

## The QR code

Points to https://tricountyslopitch.ca and is verified to decode, not just
eyeballed. It is on the print flyer only. A QR code is close to useless on
Facebook, because people are already on the phone they would scan it with.

Regenerate and re-place it with:

```bash
npx -y qrcode@1 -o qr.png -t png -w 1200 -m 1 "https://tricountyslopitch.ca"
convert qr.png -resize 117x117 qr-fit.png
convert print-letter.png qr-fit.png -geometry +753+1016 -composite out.png
```

The white square in the source art sits at 129x129 px at offset +747+1010.

## Printing

The art is 912px wide, about 107 DPI at 8.5x11, which is soft. It is 228 DPI at
4x6 and 166 DPI at 5x7. Print at 4x6 or 5x7 where possible.

For 8.5x11, upscale first so the printer does not do it badly:

```bash
convert print-letter.png -filter Lanczos -resize 300% -unsharp 0x1+0.6+0.02 \
  -density 300 -units PixelsPerInch print-letter-upscaled.png
```

That adds no real detail. It is not kept in the repo because it is 8MB.

## Facebook crop zones, learned the hard way

A cover photo is cropped differently on each device, and the first version lost
the first letters of both headline lines on mobile.

- Mobile crops to roughly the middle two thirds of the width
- Desktop puts the circular profile picture over the bottom left
- So all text must sit within the central 60% of the width, clear of the bottom
  left corner

Check before uploading rather than after:

```bash
# mobile crop
convert cover.png -gravity center -crop 1139x640+0+0 +repage -resize 640x360\! mobile.png
# desktop with the profile picture overlaid
convert cover.png -resize 820x312\! \
  \( -size 170x170 xc:none -fill "rgba(255,255,255,0.85)" -draw "circle 85,85 85,2" \) \
  -geometry +20+135 -composite desktop.png
```

The shipped cover was corrected by shifting the whole image 260px right and
rebuilding the left edge from a blurred 40px text-free slice. Asking the image
model to move the text did not work; it returned the same composition twice.

## How the art was made

Generated with Nano Banana Pro, which exports at 1K through the consumer app.
Higher resolution needs AI Studio, which costs money, so 1K is what we use.

Palette: navy #0F264F, mid blue #214B6E, gold #C1A25D.

Flyer wording: PLAYERS WANTED / TRI-COUNTY SLO-PITCH LEAGUE /
SUNDAY MORNINGS - MAY TO AUGUST / KITCHENER & WATERLOO DIAMONDS /
ALL SKILL LEVELS WELCOME / TRICOUNTYSLOPITCH.CA

Cover wording: TRI-COUNTY SLO-PITCH / KITCHENER & WATERLOO - SUNDAY MORNINGS

No price appears on any asset. That is deliberate.

Image models cannot draw a scannable QR code and reliably mangle small text,
so QR codes are always generated separately and composited in.
