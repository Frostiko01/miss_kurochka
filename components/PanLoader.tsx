'use client'

/**
 * PanLoader — анимация «сковородки» (flipping bacon) для экранов загрузки/ожидания.
 * Самодостаточный компонент: SVG + CSS-анимации (SCSS переведён в чистый CSS).
 *
 * Props:
 *  - size  — размер анимации в px (по умолчанию 96)
 *  - text  — текст под/над анимацией (опционально)
 *  - subtext — дополнительный приглушённый текст (опционально)
 */
interface PanLoaderProps {
  size?: number
  text?: string
  subtext?: string
  className?: string
}

export default function PanLoader({
  size = 96,
  text,
  subtext,
  className = '',
}: PanLoaderProps) {
  return (
    <div className={`pan-loader ${className}`}>
      <svg
        className="pl"
        viewBox="0 0 128 128"
        width={size}
        height={size}
        role="img"
        aria-label="Загрузка"
      >
        <clipPath id="pan-clip">
          <rect rx="12" ry="14" x="4" y="52" width="68" height="28" />
        </clipPath>
        <defs>
          <linearGradient id="pl-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" />
            <stop offset="100%" stopColor="#fff" />
          </linearGradient>
          <mask id="pl-mask">
            <rect x="0" y="0" width="88" height="80" fill="url(#pl-grad)" />
          </mask>
        </defs>
        <g fill="currentColor">
          <g
            fill="none"
            strokeDasharray="20 221"
            strokeDashoffset="20"
            strokeLinecap="round"
            strokeWidth="4"
          >
            <g stroke="hsl(38,90%,50%)">
              <circle className="pl__ring" cx="44" cy="40" r="35" transform="rotate(90,44,40)" />
            </g>
            <g stroke="hsl(8,90%,40%)" mask="url(#pl-mask)">
              <circle className="pl__ring" cx="44" cy="40" r="35" transform="rotate(90,44,40)" />
            </g>
          </g>
          <g fill="hsla(223,10%,70%,0)">
            <g className="pl__drop pl__drop--1">
              <circle className="pl__drop-inner" cx="13" cy="60" r="2" />
            </g>
            <g className="pl__drop pl__drop--2">
              <circle className="pl__drop-inner" cx="13" cy="60" r="2" />
            </g>
            <g className="pl__drop pl__drop--3">
              <circle className="pl__drop-inner" cx="67" cy="72" r="2" />
            </g>
            <g className="pl__drop pl__drop--4">
              <circle className="pl__drop-inner" cx="67" cy="72" r="2" />
            </g>
            <g className="pl__drop pl__drop--5">
              <circle className="pl__drop-inner" cx="67" cy="72" r="2" />
            </g>
          </g>
          <g className="pl__pan">
            <rect rx="2" ry="2" x="4" y="66" width="68" height="14" clipPath="url(#pan-clip)" id="pan" />
            <rect rx="2" ry="2" x="76" y="66" width="48" height="7" />
          </g>
          <rect
            className="pl__shadow"
            fill="hsla(223,10%,50%,0.2)"
            rx="3.5"
            ry="3.5"
            x="10"
            y="121"
            width="60"
            height="7"
          />
        </g>
      </svg>

      {text && <p className="pan-loader__text">{text}</p>}
      {subtext && <p className="pan-loader__subtext">{subtext}</p>}

      <style jsx>{`
        .pan-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }
        .pan-loader :global(.pl) {
          color: hsl(223, 10%, 50%);
        }
        .pan-loader__text {
          margin-top: 14px;
          font-size: 1rem;
          font-weight: 800;
          color: var(--fg);
          text-align: center;
        }
        .pan-loader__subtext {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--fg-muted);
          text-align: center;
        }
      `}</style>

      <style jsx global>{`
        .pl__drop,
        .pl__drop-inner,
        .pl__pan,
        .pl__ring,
        .pl__shadow {
          animation: pan 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .pl__drop {
          transform-origin: 13px 60px;
        }
        .pl__drop-inner {
          animation-timing-function: cubic-bezier(0.33, 0.84, 0.67, 0.84);
        }
        .pl__drop--1 {
          animation-name: drop-1;
        }
        .pl__drop--1 .pl__drop-inner {
          animation-name: drop-1-inner;
        }
        .pl__drop--2 {
          animation-name: drop-2;
        }
        .pl__drop--2 .pl__drop-inner {
          animation-name: drop-2-inner;
        }
        .pl__drop--3 {
          animation-name: drop-3;
          transform-origin: 67px 72px;
        }
        .pl__drop--3 .pl__drop-inner {
          animation-name: drop-3-inner;
        }
        .pl__drop--4 {
          animation-name: drop-4;
          transform-origin: 67px 72px;
        }
        .pl__drop--4 .pl__drop-inner {
          animation-name: drop-4-inner;
        }
        .pl__drop--5 {
          animation-name: drop-5;
          transform-origin: 67px 72px;
        }
        .pl__drop--5 .pl__drop-inner {
          animation-name: drop-5-inner;
        }
        .pl__pan {
          transform-origin: 36px 74px;
        }
        .pl__ring {
          animation-name: flip-ring;
        }
        .pl__shadow {
          animation-name: pan-shadow;
          transform-origin: 36px 124.5px;
        }

        @keyframes drop-1 {
          from {
            animation-timing-function: steps(1, end);
            transform: translate(0, 0);
            visibility: hidden;
          }
          30% {
            animation-timing-function: linear;
            transform: translate(0, 0);
            visibility: visible;
          }
          50%,
          to {
            transform: translate(-6px, 0);
          }
        }
        @keyframes drop-1-inner {
          from,
          30% {
            fill: hsla(223, 10%, 70%, 1);
            transform: translate(0, 0);
          }
          50%,
          to {
            fill: hsla(223, 10%, 70%, 0);
            transform: translate(0, -27px);
          }
        }
        @keyframes drop-2 {
          from {
            animation-timing-function: steps(1, end);
            transform: translate(0, 0);
            visibility: hidden;
          }
          30% {
            animation-timing-function: linear;
            transform: translate(0, 0);
            visibility: visible;
          }
          50%,
          to {
            transform: translate(-8px, 0);
          }
        }
        @keyframes drop-2-inner {
          from,
          30% {
            fill: hsla(223, 10%, 70%, 1);
            transform: translate(0, 0);
          }
          50%,
          to {
            fill: hsla(223, 10%, 70%, 0);
            transform: translate(0, -9px);
          }
        }
        @keyframes drop-3 {
          from {
            animation-timing-function: steps(1, end);
            transform: translate(0, 0);
            visibility: hidden;
          }
          78% {
            animation-timing-function: linear;
            transform: translate(0, 0);
            visibility: visible;
          }
          98%,
          to {
            transform: translate(-24px, 0);
          }
        }
        @keyframes drop-3-inner {
          from,
          78% {
            fill: hsla(223, 10%, 70%, 1);
            transform: translate(0, 0);
          }
          98%,
          to {
            fill: hsla(223, 10%, 70%, 0);
            transform: translate(0, -28px);
          }
        }
        @keyframes drop-4 {
          from {
            animation-timing-function: steps(1, end);
            transform: translate(0, 0);
            visibility: hidden;
          }
          78% {
            animation-timing-function: linear;
            transform: translate(0, 0);
            visibility: visible;
          }
          98%,
          to {
            transform: translate(-8px, 0);
          }
        }
        @keyframes drop-4-inner {
          from,
          78% {
            fill: hsla(223, 10%, 70%, 1);
            transform: translate(0, 0);
          }
          98%,
          to {
            fill: hsla(223, 10%, 70%, 0);
            transform: translate(0, -36px);
          }
        }
        @keyframes drop-5 {
          from {
            animation-timing-function: steps(1, end);
            transform: translate(0, 0);
            visibility: hidden;
          }
          78% {
            animation-timing-function: linear;
            transform: translate(0, 0);
            visibility: visible;
          }
          98%,
          to {
            transform: translate(8px, 0);
          }
        }
        @keyframes drop-5-inner {
          from,
          78% {
            fill: hsla(223, 10%, 70%, 1);
            transform: translate(0, 0);
          }
          98%,
          to {
            fill: hsla(223, 10%, 70%, 0);
            transform: translate(0, -32px);
          }
        }
        @keyframes flip-ring {
          from,
          27% {
            animation-timing-function: cubic-bezier(0.33, 0.84, 0.67, 0.84);
            stroke-dashoffset: 20;
            stroke-width: 4px;
          }
          53.5% {
            animation-timing-function: cubic-bezier(0.33, 0.16, 0.67, 0.16);
            stroke-dashoffset: -100;
            stroke-width: 10px;
          }
          80%,
          to {
            stroke-dashoffset: -220;
            stroke-width: 4px;
          }
        }
        @keyframes pan {
          from,
          88%,
          to {
            transform: translate(0, 0) rotate(0);
          }
          20% {
            animation-timing-function: cubic-bezier(0.33, 0.16, 0.67, 0.16);
            transform: translate(-5px, 0) rotate(-30deg);
          }
          30% {
            animation-timing-function: cubic-bezier(0.33, 0.84, 0.67, 0.84);
            transform: translate(0, 0) rotate(20deg);
          }
          60%,
          78% {
            animation-timing-function: linear;
            transform: translate(0, 0) rotate(0);
          }
          81.33% {
            animation-timing-function: linear;
            transform: translate(0, 4px) rotate(0);
          }
          84.67% {
            animation-timing-function: linear;
            transform: translate(0, -2px) rotate(0);
          }
        }
        @keyframes pan-shadow {
          from,
          88%,
          to {
            fill: hsla(223, 10%, 50%, 0.2);
            transform: scaleX(1);
          }
          20% {
            animation-timing-function: cubic-bezier(0.33, 0.16, 0.67, 0.16);
            fill: hsla(223, 10%, 50%, 0.2);
            transform: scaleX(0.77);
          }
          30% {
            animation-timing-function: cubic-bezier(0.33, 0.84, 0.67, 0.84);
            fill: hsla(223, 10%, 50%, 0.2);
            transform: scaleX(1);
          }
          60%,
          78% {
            animation-timing-function: linear;
            fill: hsla(223, 10%, 50%, 0.2);
            transform: scaleX(1);
          }
          81.33% {
            animation-timing-function: linear;
            fill: hsla(223, 10%, 50%, 0.25);
            transform: scaleX(0.87);
          }
          84.67% {
            animation-timing-function: linear;
            fill: hsla(223, 10%, 50%, 0.225);
            transform: scaleX(1.065);
          }
        }
      `}</style>
    </div>
  )
}
