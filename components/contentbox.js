import React from 'react';
import styles from './contentbox.css';

export function ContentBox ({ className, children, style }) {
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div
        className={'ContentBox'}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}
