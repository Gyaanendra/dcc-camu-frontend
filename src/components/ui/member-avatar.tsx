"use client"

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { resolveAvatarUrl } from '@/lib/avatar-cache';
import { generateClientNotionistAvatar } from '@/lib/avatar';

interface MemberAvatarProps {
  src?: string | null;
  name?: string;
  className?: string;
  fallbackClassName?: string;
}

export function MemberAvatar({ src, name, className, fallbackClassName }: MemberAvatarProps) {
  const effectiveSrc = src || (name ? generateClientNotionistAvatar(name) : undefined);
  const resolvedUrl = effectiveSrc ? resolveAvatarUrl(effectiveSrc) : undefined;

  return (
    <Avatar className={className}>
      {resolvedUrl && <AvatarImage src={resolvedUrl} alt={name || 'Avatar'} draggable={false} />}
      <AvatarFallback className={fallbackClassName || "bg-secondary text-foreground text-xs font-bold"}>
        {name ? name.charAt(0).toUpperCase() : '?'}
      </AvatarFallback>
    </Avatar>
  );
}
