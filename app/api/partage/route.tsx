import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { decodeRibbon } from '@/lib/design/share-code';
import { RIBBON_HEIGHT, RIBBON_SHARE_WIDTH, ribbonDataUri } from '@/lib/design/ribbon-svg';
import { INK, PAPER, SURFACE } from '@/lib/design/tokens';

/**
 * L'image de partage.
 *
 * Le ruban, un prénom, la marque. Rien d'autre — pas de score, pas de date, pas
 * d'accroche. Ce qui circule est une forme qu'on ne peut pas lire sans avoir le
 * sien : c'est ce qui donne envie de le calculer, et c'est aussi ce qui fait
 * qu'aucune donnée personnelle ne voyage. L'adresse ne porte que les hauteurs de
 * barres et les saisons, jamais la naissance — voir `share-code.ts`.
 *
 * `next/og` est fourni par Next : aucune dépendance ajoutée.
 */

export const runtime = 'nodejs';

const WIDTH = 1200;
const HEIGHT = 630;
/** Le ruban est dessiné pour un téléphone : il faut le doubler pour une vignette. */
const SCALE = 2;

/*
 * Satori n'a ni `next/font` ni accès au navigateur : la police doit lui être
 * donnée en octets. Elle est versionnée dans `assets/fonts` — Geist Mono sous
 * licence SIL Open Font, redistribution autorisée, la licence l'accompagne. La
 * lecture est faite une fois, au premier appel, et gardée en mémoire.
 */
let police: ArrayBuffer | null = null;
function fontData(): ArrayBuffer {
  if (!police) {
    const buffer = readFileSync(join(process.cwd(), 'assets/fonts/GeistMono-SemiBold.ttf'));
    police = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  }
  return police;
}

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get('r');
  if (!code) return new Response('paramètre « r » manquant', { status: 400 });

  let days;
  try {
    days = decodeRibbon(code);
  } catch {
    // On refuse plutôt que de dessiner un ruban inventé : une image de partage
    // fausse est pire qu'une image absente.
    return new Response('ruban illisible', { status: 400 });
  }

  // Le prénom est écrit par un inconnu : on le borne et on ne garde que des
  // lettres. Satori ne rend pas de balises, mais une adresse partagée ne doit
  // pas non plus servir à faire écrire n'importe quoi à la marque.
  const firstName = (params.get('n') ?? '').replace(/[^\p{L}\p{M}'’ -]/gu, '').trim().slice(0, 24);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 44,
          background: PAPER, fontFamily: 'Geist Mono', color: INK,
        }}
      >
        <div
          style={{
            display: 'flex', padding: 36, borderRadius: 28, background: SURFACE,
            boxShadow: '0 20px 60px -30px rgba(15,20,25,0.35)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ribbonDataUri(days)}
            width={RIBBON_SHARE_WIDTH * SCALE}
            height={RIBBON_HEIGHT * SCALE}
            alt=""
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          {firstName ? (
            <span style={{ fontSize: 34, letterSpacing: '0.02em' }}>{firstName}</span>
          ) : null}
          <span style={{ fontSize: 34, letterSpacing: '-0.04em', opacity: 0.45 }}>Bien.Luné</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: 'Geist Mono', data: fontData(), weight: 600, style: 'normal' }],
      /*
       * L'adresse détermine entièrement l'image : même code, même pixels, pour
       * toujours. Un robot de messagerie qui la redemande n'a aucune raison de la
       * faire recalculer — et ces robots la redemandent beaucoup.
       */
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
    },
  );
}
