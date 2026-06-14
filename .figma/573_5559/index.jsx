import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.selectYourGoal}>
      <div className={styles.frame1321315079}>
        <img src="../image/mkv4i7jf-ykrafel.svg" className={styles.vector} />
        <p className={styles.search}>Search...</p>
      </div>
      <p className={styles.growWealth}>Grow wealth</p>
      <p className={styles.loseWeight}>Lose weight</p>
      <p className={styles.loseWeight}>Master tech skill</p>
      <p className={styles.loseWeight}>Exercise regularly</p>
      <p className={styles.loseWeight}>Strengthen your spirit</p>
      <p className={styles.loseWeight}>Level up your career</p>
      <p className={styles.loseWeight}>Excel academically</p>
      <p className={styles.loseWeight}>Read more</p>
      <p className={styles.loseWeight}>Stay healthy</p>
    </div>
  );
}

export default Component;
