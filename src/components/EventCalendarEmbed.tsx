'use client';

import React, { useEffect, useRef } from 'react';

function EventCalendarEmbed() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!document.querySelector('script[src*="elfsight.com/platform.js"]')) {
      const s = document.createElement('script');
      s.src = 'https://static.elfsight.com/platform/platform.js';
      s.async = true;
      document.body.appendChild(s);
    }

    if (!containerRef.current.querySelector('.elfsight-app-4883f7dd-efd5-4cef-95b5-895cd2330ed6')) {
      const d = document.createElement('div');
      d.className = 'elfsight-app-4883f7dd-efd5-4cef-95b5-895cd2330ed6';
      d.setAttribute('data-elfsight-app-lazy', '');
      containerRef.current.appendChild(d);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',       // full width of parent container
        maxWidth: '600px',   // max width limit
        height: '400px',     // fixed height limit
        overflow: 'auto',    // scrollbars if content overflows
        margin: '0 auto',    // center horizontally if you want
      }}
    />
  );
}

export default EventCalendarEmbed;
