import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Upload } from "lucide-react"

interface FileInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  label?: string
  buttonText?: string
  buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  buttonSize?: "default" | "sm" | "lg" | "icon"
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ 
    className, 
    label, 
    buttonText = "Choose File", 
    buttonVariant = "outline",
    buttonSize = "default",
    onChange,
    ...props 
  }, ref) => {
    const [fileName, setFileName] = React.useState<string>("")
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Use the forwarded ref or fallback to internal ref
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || fileInputRef

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      setFileName(file?.name || "")
      onChange?.(event)
    }

    const handleButtonClick = () => {
      inputRef.current?.click()
    }

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium">{label}</label>
        )}
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            {...props}
          />
          <Button
            type="button"
            variant={buttonVariant}
            size={buttonSize}
            onClick={handleButtonClick}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>{buttonText}</span>
          </Button>
          {fileName && (
            <span className="text-sm text-muted-foreground truncate max-w-xs">
              {fileName}
            </span>
          )}
        </div>
      </div>
    )
  }
)

FileInput.displayName = "FileInput"

export { FileInput }
