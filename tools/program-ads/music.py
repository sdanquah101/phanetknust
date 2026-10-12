"""Danceable background music for the PHANET program ads, synthesised from scratch.

Afro-house / amapiano groove at 120 BPM: four-on-the-floor kick, claps on 2 and 4, swung
shakers, congas, a log-drum bassline, marimba plucks, warm pads that pump with the kick,
a bell hook, and risers/impacts on the scene changes. 8 bars = 16 seconds.

Usage: music.py <program-slug> <out.wav>
"""
import sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 8
DUR = BARS * BAR          # 16 s
N = int(SR * (DUR + 0.6))  # a little tail, trimmed by the video
SWING = 0.12               # share of a 16th the off-16ths are pushed late

# Per program: key root (MIDI), chords (semitones from root, one per bar), bell hook (step16, degree), feel.
SONGS = {
    "gathering-of-the-adelphos": dict(root=53, chords=[[0, 4, 7, 11], [7, 11, 14, 17], [9, 12, 16, 19], [5, 9, 12, 16]],
                                      hook=[(0, 12), (3, 14), (6, 16), (10, 14), (12, 12), (14, 9)], bright=1.0, seed=3),
    "night-of-solemnities":      dict(root=50, chords=[[0, 3, 7, 10], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 2, 5, 8]],
                                      hook=[(0, 15), (4, 14), (6, 12), (10, 10), (12, 12), (15, 7)], bright=0.75, seed=7),
    "academic-excellence-retreat": dict(root=55, chords=[[0, 4, 7, 11], [7, 11, 14, 17], [9, 12, 16, 19], [5, 9, 12, 16]],
                                      hook=[(0, 16), (2, 14), (4, 12), (7, 14), (10, 16), (12, 19)], bright=1.1, seed=11),
    "prophetic-convocation":     dict(root=51, chords=[[0, 4, 7, 11], [7, 11, 14, 17], [9, 12, 15, 19], [8, 12, 15, 19]],
                                      hook=[(0, 12), (4, 16), (6, 19), (8, 16), (12, 14), (14, 12)], bright=0.9, seed=5),
    "business-masterclass":      dict(root=57, chords=[[0, 3, 7, 10], [-4, 0, 3, 7], [3, 7, 10, 14], [-2, 2, 5, 8]],
                                      hook=[(0, 12), (3, 15), (6, 12), (8, 10), (11, 12), (14, 15)], bright=1.05, seed=13),
}

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def t16(bar, step):
    """Time of a 16th step in a bar, with swing on the off-16ths."""
    t = bar * BAR + step * BEAT / 4
    if step % 2 == 1:
        t += SWING * BEAT / 4
    return t

def env_exp(n, decay):
    return np.exp(-np.arange(n) / SR * decay)

def lp(x, f, order=2): return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], "band", fs=SR, output="sos"), x)

class Mix:
    def __init__(self):
        self.dry = np.zeros((N, 2))
        self.verb = np.zeros((N, 2))
        self.kicks = []
    def add(self, t, sig, gain=1.0, pan=0.0, send=0.0):
        i = int(round(t * SR))
        if i >= N: return
        sig = sig[: N - i] * gain
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        self.dry[i:i + len(sig), 0] += sig * l
        self.dry[i:i + len(sig), 1] += sig * r
        if send:
            self.verb[i:i + len(sig), 0] += sig * l * send
            self.verb[i:i + len(sig), 1] += sig * r * send

# ---------- instruments ----------
def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 7.0)
    click = hp(np.random.default_rng(1).standard_normal(n), 2500) * env_exp(n, 400) * 0.25
    return np.tanh((body + click) * 1.6)

def clap(rng):
    n = int(0.25 * SR)
    noise = bp(rng.standard_normal(n), 900, 3200)
    e = np.zeros(n)
    for k, off in enumerate([0, 0.011, 0.022]):  # the flam of several hands
        i = int(off * SR)
        e[i:] += env_exp(n - i, 90 if k < 2 else 22) * (0.7 if k < 2 else 1.0)
    return noise * e

def shaker(rng, accent):
    n = int(0.06 * SR)
    return hp(rng.standard_normal(n), 6500) * env_exp(n, 70) * accent

def open_hat(rng):
    n = int(0.22 * SR)
    return hp(rng.standard_normal(n), 8000) * env_exp(n, 18)

def conga(f, rng):
    n = int(0.25 * SR); t = np.arange(n) / SR
    ff = f * (1 + 0.25 * np.exp(-t * 40))
    tone = np.sin(2 * np.pi * np.cumsum(ff) / SR) * env_exp(n, 16)
    slap = bp(rng.standard_normal(n), 1500, 5000) * env_exp(n, 120) * 0.25
    return tone + slap

def log_drum(m, length):
    """The amapiano log drum: a gliding, saturated low tone."""
    n = int(length * SR); t = np.arange(n) / SR
    f = hz(m) * (1 + 0.55 * np.exp(-t * 35))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) * env_exp(n, 4.5)
    x = np.tanh(x * 2.4) * 0.8
    att = np.minimum(1, np.arange(n) / (0.004 * SR))
    return lp(x * att, 1100)

def marimba(m):
    n = int(0.9 * SR); t = np.arange(n) / SR; f = hz(m)
    x = (np.sin(2 * np.pi * f * t) * env_exp(n, 7) + 0.4 * np.sin(2 * np.pi * 4 * f * t) * env_exp(n, 22)
         + 0.12 * np.sin(2 * np.pi * 9.8 * f * t) * env_exp(n, 60))
    return x * np.minimum(1, np.arange(n) / (0.002 * SR))

def bell(m):
    n = int(1.6 * SR); t = np.arange(n) / SR; f = hz(m)
    idx = 2.2 * np.exp(-t * 6)
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * 3.5 * f * t)) * env_exp(n, 3.2)
    return x * np.minimum(1, np.arange(n) / (0.003 * SR))

def pad_chord(notes, length, bright, rng):
    n = int(length * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for m in notes:
        for det in (-0.09, 0.0, 0.08):
            f = hz(m + det)
            ph = (f * t + rng.random()) % 1.0
            x += (2 * ph - 1) * 0.33  # saw
    x = lp(x, 1400 * bright, order=2)
    a = np.minimum(1, t / 0.08); r = np.minimum(1, (length - t) / 0.12)
    return x * a * np.clip(r, 0, 1) / len(notes)

def sub(m, length):
    n = int(length * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * hz(m) * t)
    return x * np.minimum(1, t / 0.01) * np.clip((length - t) / 0.05, 0, 1)

def riser(length, rng):
    n = int(length * SR); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n); blocks = 48
    for b in range(blocks):  # a filter that opens up as it rises
        s, e = b * n // blocks, (b + 1) * n // blocks
        fc = 400 * (16 ** (b / blocks))
        out[s:e] = bp(noise, max(60, fc * 0.6), min(SR / 2 - 100, fc * 1.6))[s:e]
    tone = np.sin(2 * np.pi * np.cumsum(220 * 4 ** (t / length)) / SR) * 0.15
    return (out + tone) * (t / length) ** 2

def impact(rng):
    n = int(1.6 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(60 + 40 * np.exp(-t * 20)) / SR) * env_exp(n, 4)
    crash = hp(rng.standard_normal(n), 5000) * env_exp(n, 3.5) * 0.35
    return np.tanh(boom * 1.2) * 0.8 + crash

def sidechain(times, n, depth=0.62, rel=0.16):
    g = np.ones(n); t = np.arange(n) / SR
    for k in times:
        i = int(k * SR)
        seg = t[i:] - k
        g[i:] = np.minimum(g[i:], 1 - depth * np.exp(-seg / rel))
    return g

def reverb_ir(rng, length=1.4):
    n = int(length * SR)
    ir = rng.standard_normal((n, 2)) * env_exp(n, 4.2)[:, None]
    ir[:, 0] = lp(ir[:, 0], 6000); ir[:, 1] = lp(ir[:, 1], 6000)
    return ir / np.sqrt((ir ** 2).sum(0))

# ---------- arrangement ----------
def song(slug):
    S = SONGS[slug]; rng = np.random.default_rng(S["seed"]); mx = Mix()
    root, chords, bright = S["root"], S["chords"], S["bright"]
    K = kick()
    full = range(1, 8)  # bar 0 is the build

    # drums
    for bar in range(BARS):
        last_bar = bar == BARS - 1
        for beat in range(4):
            t = bar * BAR + beat * BEAT
            if bar in full and not (last_bar and beat == 3):
                mx.add(t, K, 0.95); mx.kicks.append(t)
            if bar in full and beat in (1, 3) and not (last_bar and beat == 3):
                mx.add(t, clap(rng), 0.42, 0.05, send=0.25)
            if bar in full and not last_bar:
                mx.add(t + BEAT / 2, open_hat(rng), 0.10, -0.3)
        for s in range(16):
            if last_bar and s >= 12: break
            acc = 0.5 if s % 4 == 2 else (0.32 if s % 2 else 0.2)
            mx.add(t16(bar, s), shaker(rng, acc), 0.22 if bar else 0.16, 0.35)
        if bar >= 2 and not last_bar:
            for s, f, pan in [(3, 210, -0.45), (7, 280, 0.4), (10, 210, -0.45), (14, 330, 0.45), (15, 280, 0.4)]:
                mx.add(t16(bar, s), conga(f, rng), 0.24, pan, send=0.1)
    # clap roll into the drop
    for k in range(8):
        mx.add(BAR - BEAT + k * BEAT / 8, clap(rng), 0.12 + 0.05 * k, 0.0, send=0.3)

    # log drum + sub, following each bar's chord root
    pattern = [(0, 0, 0.30), (3, 0, 0.22), (6, 12, 0.2), (8, 7, 0.28), (11, 0, 0.18), (14, 12, 0.2)]
    for bar in full:
        ch = chords[bar % 4]
        r = root - 12 + ch[0]
        for s, off, ln in pattern:
            if bar == BARS - 1 and s >= 12: break
            mx.add(t16(bar, s), log_drum(r + off, ln + 0.15), 0.55)
        mx.add(bar * BAR, sub(r - 12, BAR if bar < BARS - 1 else 3 * BEAT), 0.16)

    # pads (pumping), marimba arps, bell hook
    pads = np.zeros((N, 2))
    for bar in range(BARS):
        ch = chords[bar % 4]
        ln = BAR if bar < BARS - 1 else 3 * BEAT + 1.2
        p = pad_chord([root + n for n in ch], ln, bright * (0.55 if bar == 0 else 1.0), rng)
        i = int(bar * BAR * SR)
        seg = p[: N - i]
        pads[i:i + len(seg), 0] += seg * 0.9; pads[i:i + len(seg), 1] += seg
    pads[:int(BAR * SR)] *= np.linspace(0.35, 1.0, int(BAR * SR))[:, None]  # swells in during the build
    pads *= sidechain(mx.kicks, N)[:, None]
    mx.dry += pads * 0.34; mx.verb += pads * 0.12

    arp = [0, 2, 3, 6, 8, 10, 11, 14]
    for bar in range(BARS):
        ch = chords[bar % 4]
        for k, s in enumerate(arp):
            if bar == BARS - 1 and s >= 12: break
            if bar == 0 and s < 8: continue
            m = root + 12 + ch[[0, 2, 1, 3, 2, 0, 3, 1][k]]
            mx.add(t16(bar, s), marimba(m), 0.16 if k % 2 else 0.2, 0.25 if k % 2 else -0.25, send=0.22)
    for bar in range(3, 7):
        for s, deg in S["hook"]:
            mx.add(t16(bar, s), bell(root + 12 + deg), 0.11, 0.1, send=0.35)

    # final stab on beat 3 of the last bar: everything hits together, then rings out
    tfin = (BARS - 1) * BAR + 2 * BEAT
    mx.add(tfin, K, 1.0); mx.add(tfin, impact(rng), 0.5, 0, send=0.4)
    for n_ in chords[0]:
        mx.add(tfin, bell(root + 12 + n_), 0.09, 0, send=0.5)
        mx.add(tfin, marimba(root + n_), 0.2, 0, send=0.3)
    mx.add(tfin, log_drum(root - 12 + chords[0][0], 0.9), 0.6)

    # FX: riser into the drop, impacts on every scene change
    mx.add(0.2, riser(BAR - 0.2, rng), 0.35, 0, send=0.2)
    for b in (1, 3, 5, 7):
        mx.add(b * BAR, impact(rng), 0.42 if b == 1 else 0.26, 0, send=0.3)

    # reverb, glue, limit
    ir = reverb_ir(rng)
    wet = np.stack([fftconvolve(mx.verb[:, c], ir[:, c])[:N] for c in range(2)], 1)
    out = mx.dry + wet * 0.55
    out = hp(out.T, 30).T
    out = np.tanh(out * 1.1)
    out /= np.max(np.abs(out)) / 0.89  # peak at -1 dBFS
    out *= 0.62                         # about -12 LUFS: lively but not tiring
    fade = int(0.5 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return out

def write_wav(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())

if __name__ == "__main__":
    slug, out = sys.argv[1], sys.argv[2]
    write_wav(out, song(slug))
    print(f"{slug}: {out}")
