import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.footer}>
      <div className={styles.autoWrapper}>
        <p className={styles.lOgo}>LOGO</p>
        <div className={styles.frame55}>
          <img src="../image/mkufm63f-n9timpz.svg" className={styles.group} />
          <p className={styles.a2025CopyrightGoalHy}>
            2025 Copyright goalHyke.com - All rights reserved
          </p>
        </div>
        <img src="../image/mkufm63k-hwagxtq.svg" className={styles.frame135} />
      </div>
      <div className={styles.frame57}>
        <p className={styles.general}>General</p>
        <div className={styles.frame56}>
          <p className={styles.aboutUs}>About us</p>
          <p className={styles.aboutUs}>Help Center</p>
          <p className={styles.aboutUs}>Contact Us</p>
        </div>
      </div>
      <div className={styles.frame58}>
        <div className={styles.frame562}>
          <p className={styles.termsOfUse}>Terms of Use</p>
          <p className={styles.termsOfUse}>Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}

export default Component;
