import primaryAvatar from '../assets/avatars/primary.jpg';
import middleAvatar from '../assets/avatars/middle.jpg';
import highAvatar from '../assets/avatars/high.jpg';

export const getStudentAvatar = (className) => {
  if (!className) return primaryAvatar;
  
  if (className.includes('ابتدائي')) {
    return primaryAvatar;
  } else if (className.includes('متوسط')) {
    return middleAvatar;
  } else if (className.includes('ثانوي')) {
    return highAvatar;
  }
  
  // Default fallback
  return primaryAvatar;
};
