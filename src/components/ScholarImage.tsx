// src/components/ScholarImage.tsx
//
// Renders a scholar's photo, falling back to a default placeholder when
// image_url is missing OR the URL fails to load (404, broken host, etc).
//
// Make sure a default avatar exists at src/assets/scholar.png — swap the
// import path below if yours lives somewhere else or has a different name.
import React, { useEffect, useState } from "react";
import defaultScholarImage from "../assets/scholar.png";

interface ScholarImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

const ScholarImage: React.FC<ScholarImageProps> = ({ src, alt, className = "" }) => {
  const [imgSrc, setImgSrc] = useState(src || defaultScholarImage);

  // Keep in sync if the underlying scholar prop changes (e.g. list re-fetch)
  useEffect(() => {
    setImgSrc(src || defaultScholarImage);
  }, [src]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(defaultScholarImage)}
    />
  );
};

export default ScholarImage;