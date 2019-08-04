export type LastDirContent = {
  images: LastDirImageContent[];
  isSingleScale: boolean;
};

export type LastDirImageContent = {
  fileName: string;
  scale?: string;
};
