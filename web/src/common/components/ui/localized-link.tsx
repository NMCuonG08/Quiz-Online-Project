"use client";

import React from "react";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { useLocale } from "next-intl";

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export type LocalizedLinkProps = NextLinkProps & AnchorProps;

function isExternal(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

function isHash(href: string): boolean {
  return href.startsWith("#");
}

export default function LocalizedLink({ href, ...props }: LocalizedLinkProps) {
  const locale = useLocale();

  let nextHref = href;
  if (typeof href === "string") {
    // Only prefix internal absolute paths
    if (href.startsWith("/") && !isExternal(href) && !isHash(href)) {
      const alreadyPrefixed = href.split("/")[1] === locale;
      nextHref = alreadyPrefixed ? href : `/${locale}${href}`;
    }
  }

  return <NextLink href={nextHref as any} {...props} />;
}


