import React from 'react';
import { Lightbulb } from 'lucide-react';
interface ImageGenerationTipProps {
  show: boolean;
}
const ImageGenerationTip: React.FC<ImageGenerationTipProps> = ({
  show
}) => {
  if (!show) return null;
  return;
};
export default ImageGenerationTip;