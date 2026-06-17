import React from 'react';
import Svg, { Path, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg';

interface HeartProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

export function HeartIcon({ size = 24, color = '#C9A84C', filled = true }: HeartProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21.593c-.525-.444-5.422-3.987-7.64-6.801C2.748 12.707 2 11.05 2 9.5 2 6.464 4.348 4 7.5 4c1.922 0 3.573.924 4.5 2.36C12.927 4.924 14.578 4 16.5 4 19.652 4 22 6.464 22 9.5c0 1.55-.748 3.207-2.36 5.292C17.422 17.606 12.525 21.149 12 21.593z"
        fill={filled ? color : 'none'}
        stroke={filled ? 'none' : color}
        strokeWidth={filled ? 0 : 1.5}
      />
    </Svg>
  );
}

interface RingProps {
  size?: number;
  color?: string;
}

export function RingIcon({ size = 24, color = '#C9A84C' }: RingProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" fill="none" />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5" fill="none" />
      <Path
        d="M8 12 Q9 9 12 8 Q15 9 16 12"
        stroke={color}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface GiftProps {
  size?: number;
  color?: string;
}

export function GiftIcon({ size = 24, color = '#C9A84C' }: GiftProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12v10H4V12"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 7H2v5h20V7z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22V7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface MessageBubbleProps {
  size?: number;
  color?: string;
}

export function MessageBubbleIcon({ size = 24, color = '#C9A84C' }: MessageBubbleProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 10h8M8 14h5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface CalendarProps {
  size?: number;
  color?: string;
}

export function CalendarIcon({ size = 24, color = '#C9A84C' }: CalendarProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2v3M16 2v3M3 8h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 13h2v2H8zM13 13h2v2h-2z"
        fill={color}
      />
    </Svg>
  );
}

export function DashboardIcon({ size = 24, color = '#C9A84C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GlowingHeart({ size = 80 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <Defs>
        <RadialGradient id="heartGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#C9A84C" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="heartFill" cx="40%" cy="35%" r="60%">
          <Stop offset="0%" stopColor="#E2C97E" />
          <Stop offset="100%" stopColor="#9E7A2E" />
        </RadialGradient>
      </Defs>
      <Circle cx="40" cy="40" r="38" fill="url(#heartGlow)" />
      <G transform="translate(14, 16) scale(2.15)">
        <Path
          d="M12 21.593c-.525-.444-5.422-3.987-7.64-6.801C2.748 12.707 2 11.05 2 9.5 2 6.464 4.348 4 7.5 4c1.922 0 3.573.924 4.5 2.36C12.927 4.924 14.578 4 16.5 4 19.652 4 22 6.464 22 9.5c0 1.55-.748 3.207-2.36 5.292C17.422 17.606 12.525 21.149 12 21.593z"
          fill="url(#heartFill)"
          transform="scale(0.48) translate(-3, -3)"
        />
      </G>
    </Svg>
  );
}
