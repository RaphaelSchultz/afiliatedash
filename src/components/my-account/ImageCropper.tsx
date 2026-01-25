import { useState, useCallback, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ZoomIn, RotateCw, Check, X, ArrowLeft, Eye } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
}

type Step = 'crop' | 'preview';

// Helper function to create cropped image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Calculate bounding box of the rotated image
  const rotRad = (rotation * Math.PI) / 180;
  const bBoxWidth = Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height);
  const bBoxHeight = Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height);

  // Set canvas size to the cropped area size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Translate and rotate
  ctx.translate(-pixelCrop.x, -pixelCrop.y);
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw the image
  ctx.drawImage(image, 0, 0);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

export function ImageCropper({
  open,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropperProps) {
  const [step, setStep] = useState<Step>('crop');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('crop');
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setPreviewUrl(null);
      setCroppedBlob(null);
    }
  }, [open]);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePreview = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      setCroppedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      setStep('preview');
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (!croppedBlob) return;
    onCropComplete(croppedBlob);
    handleClose();
  };

  const handleBack = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCroppedBlob(null);
    setStep('crop');
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setPreviewUrl(null);
    setCroppedBlob(null);
    setStep('crop');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>
            {step === 'crop' ? 'Ajustar foto' : 'Pré-visualização'}
          </DialogTitle>
        </DialogHeader>

        {step === 'crop' ? (
          <>
            <div className="relative w-full h-[300px] bg-background">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropCompleteCallback}
              />
            </div>

            <div className="p-4 space-y-4">
              {/* Zoom control */}
              <div className="flex items-center gap-3">
                <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(value) => setZoom(value[0])}
                  className="flex-1"
                />
              </div>

              {/* Rotate button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="w-full gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Girar 90°
              </Button>
            </div>

            <DialogFooter className="p-4 pt-0 gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                onClick={handlePreview}
                disabled={isProcessing}
                className="flex-1 gap-2 gradient-shopee text-white"
              >
                <Eye className="w-4 h-4" />
                {isProcessing ? 'Processando...' : 'Pré-visualizar'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            {/* Preview Step */}
            <div className="flex flex-col items-center justify-center py-8 px-4 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Sua foto ficará assim:
              </p>
              <Avatar className="w-32 h-32 border-4 border-border shadow-lg">
                <AvatarImage src={previewUrl || undefined} alt="Preview" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground text-center">
                Confira se está do seu agrado antes de salvar
              </p>
            </div>

            <DialogFooter className="p-4 pt-0 gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 gap-2 gradient-shopee text-white"
              >
                <Check className="w-4 h-4" />
                Salvar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
