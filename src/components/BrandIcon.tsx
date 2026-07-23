interface BrandIconProps {
  className?: string;
}

export default function BrandIcon({ className }: BrandIconProps) {
  return (
    <img alt="" aria-hidden="true" className={className} draggable={false} src="/favicon.svg" />
  );
}
