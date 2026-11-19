# Squeeze Stroll's PNG icons, splash screens and social card to 256-colour PNGs.
# Same pixel sizes, transparency kept. Usage: squeeze.py <src dir> <out dir>
# RGB files: Pillow's max-coverage palette. RGBA files: a small k-means over the
# image's own colours (alpha included), because Pillow's RGBA quantiser bands the gradients.
from PIL import Image
import glob, os, io, math, sys
import numpy as np

def enc(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True, compress_level=9); return b.getvalue()

def diff(a, b):
    # how far any pixel moved, as seen: both laid over black, white and grey
    worst, low = 0, 99.0
    for bg in ((0, 0, 0, 255), (255, 255, 255, 255), (128, 128, 128, 255)):
        x = np.asarray(Image.alpha_composite(Image.new('RGBA', a.size, bg), a.convert('RGBA')), dtype=np.int16)
        y = np.asarray(Image.alpha_composite(Image.new('RGBA', a.size, bg), b.convert('RGBA')), dtype=np.int16)
        d = np.abs(x - y); mse = float((d.astype(np.float64) ** 2).mean())
        worst = max(worst, int(d.max())); low = min(low, 99.0 if mse == 0 else 10 * math.log10(255 * 255 / mse))
    return worst, low

def dithered(im):
    # pick 256 colours, then lay them down with error diffusion so glows and skies do not band
    pal = im.quantize(256, method=Image.Quantize.MAXCOVERAGE, kmeans=3, dither=Image.Dither.NONE)
    return im.quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG)

def kmeans_rgba(im, n=256, rounds=40):
    px = np.asarray(im.convert('RGBA')).reshape(-1, 4)
    cols, inv, cnt = np.unique(px, axis=0, return_inverse=True, return_counts=True)
    inv = inv.reshape(-1)
    if len(cols) <= n:
        cent = cols.astype(np.float64); lab = np.arange(len(cols))
    else:
        c = cols.astype(np.float64)
        # work in premultiplied colour so a see-through pixel's hidden colour does not matter
        f = np.concatenate([c[:, :3] * (c[:, 3:4] / 255.0), c[:, 3:4]], axis=1)
        w = cnt.astype(np.float64)
        # start: farthest-point picks, seeded with the most common colour
        idx = [int(np.argmax(w))]; dmin = ((f - f[idx[0]]) ** 2).sum(1)
        for _ in range(n - 1):
            j = int(np.argmax(dmin)); idx.append(j); dmin = np.minimum(dmin, ((f - f[j]) ** 2).sum(1))
        cf = f[idx].copy()
        for _ in range(rounds):
            d = ((f[:, None, :] - cf[None, :, :]) ** 2).sum(2); lab = d.argmin(1)
            for k in range(n):
                m = lab == k
                if m.any(): cf[k] = (f[m] * w[m, None]).sum(0) / w[m].sum()
        d = ((f[:, None, :] - cf[None, :, :]) ** 2).sum(2); lab = d.argmin(1)
        a = np.clip(cf[:, 3:4], 0, 255)
        rgb = np.where(a > 0, cf[:, :3] * 255.0 / np.maximum(a, 1e-6), 0)
        cent = np.concatenate([np.clip(rgb, 0, 255), a], axis=1)
    cent = np.rint(cent).astype(np.uint8)
    # see-through entries first so the transparency chunk stays short
    order = np.argsort(cent[:, 3], kind='stable'); cent = cent[order]
    # lay the palette down with error diffusion (Floyd-Steinberg, premultiplied) so soft gradients do not band
    pal = cent.astype(np.float64); palf = np.concatenate([pal[:, :3] * (pal[:, 3:4] / 255.0), pal[:, 3:4]], axis=1)
    W, H = im.size; p = px.reshape(H, W, 4).astype(np.float64)
    img = np.concatenate([p[..., :3] * (p[..., 3:4] / 255.0), p[..., 3:4]], axis=2)
    idx = np.zeros((H, W), dtype=np.uint8); WT = np.array([1.0, 1.0, 1.0, 4.0])
    for y in range(H):
        row = img[y]
        for x in range(W):
            old = row[x]; k = int((((palf - old) ** 2) * WT).sum(1).argmin()); idx[y, x] = k
            err = np.clip(old - palf[k], -24, 24); err[3] = 0.0
            if p[y, x, 3] < 255: err[:] = 0.0  # keep the soft edge exact: no noise on the rounded corner
            if x + 1 < W: row[x + 1] += err * 0.4375
            if y + 1 < H:
                nxt = img[y + 1]
                if x > 0: nxt[x - 1] += err * 0.1875
                nxt[x] += err * 0.3125
                if x + 1 < W: nxt[x + 1] += err * 0.0625
    out = Image.new('P', im.size); out.putdata(idx.reshape(-1).tolist())
    out.putpalette(cent[:, :3].reshape(-1).tolist())
    alpha = cent[:, 3].tolist()
    while alpha and alpha[-1] == 255: alpha.pop()
    if alpha: out.info['transparency'] = bytes(alpha)
    return out

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    os.makedirs(out, exist_ok=True); tb = ta = 0
    for f in sorted(glob.glob(src + '/*.png')):
        name = os.path.basename(f); im = Image.open(f); im.load(); before = os.path.getsize(f)
        q = kmeans_rgba(im) if im.mode == 'RGBA' else dithered(im)
        data = enc(q); lossless = enc(im)
        if len(lossless) <= len(data): data, q = lossless, im
        open(os.path.join(out, name), 'wb').write(data)
        back = Image.open(io.BytesIO(data)); assert back.size == im.size
        mx, ps = diff(im, back)
        if im.mode == 'RGBA':
            a0 = np.asarray(im.getchannel('A')); a1 = np.asarray(back.convert('RGBA').getchannel('A'))
            extra = '  alpha maxdiff %d, clear px %d -> %d' % (int(np.abs(a0.astype(int) - a1.astype(int)).max()), int((a0 == 0).sum()), int((a1 == 0).sum()))
        else: extra = ''
        tb += before; ta += len(data)
        print('%-26s %7d -> %7d  (%4.1f%%)  %dx%d  maxdiff %2d  psnr %.1f%s' % (name, before, len(data), 100 * len(data) / before, im.size[0], im.size[1], mx, ps, extra))
    print('%-26s %7d -> %7d  (%4.1f%%)  saved %d bytes' % ('TOTAL', tb, ta, 100 * ta / tb, tb - ta))
