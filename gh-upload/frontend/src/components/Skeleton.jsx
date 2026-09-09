/**
 * Skeleton.jsx — placeholders animados durante loading
 *
 * Substitui "A carregar…" por skeletons com efeito shimmer, dando a
 * sensação de que a aplicação é mais rápida e profissional.
 */

const baseStyle = {
  background: 'linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.4s ease-in-out infinite',
  borderRadius: 6,
};

const keyframes = `
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`;

function Skeleton({ width = '100%', height = 16, style = {}, rounded = 6, className = '' }) {
  return (
    <>
      <style>{keyframes}</style>
      <div
        className={className}
        style={{
          ...baseStyle,
          width,
          height,
          borderRadius: rounded,
          ...style,
        }}
        aria-hidden="true"
      />
    </>
  );
}

export function SkeletonText({ lines = 3, lastWidth = '60%' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastWidth : '100%'}
          height={12}
        />
      ))}
    </div>
  );
}

export function SkeletonAlertCard() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '4px 1fr auto',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 8,
      background: '#0f172a',
    }}>
      <Skeleton width={4} height={48} rounded={2} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton width="40%" height={14} />
        <Skeleton width="70%" height={10} />
        <Skeleton width="50%" height={10} />
      </div>
      <Skeleton width={56} height={20} rounded={10} />
    </div>
  );
}

export function SkeletonAlertList({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAlertCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonMap() {
  return (
    <Skeleton
      width="100%"
      height={460}
      rounded={12}
      style={{ minHeight: 460 }}
    />
  );
}

export function SkeletonHeader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <Skeleton width={300} height={24} style={{ marginBottom: 8 }} />
        <Skeleton width={400} height={12} />
      </div>
      <div style={{ textAlign: 'right' }}>
        <Skeleton width={80} height={28} style={{ marginBottom: 6 }} />
        <Skeleton width={150} height={10} />
      </div>
    </div>
  );
}
