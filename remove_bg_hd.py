from PIL import Image

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        lum = (item[0] * 0.299 + item[1] * 0.587 + item[2] * 0.114)
        alpha = int(255 - lum)
        
        # Boost alpha slightly for stronger visibility of edges
        alpha = min(255, int(alpha * 1.5))
        
        if alpha < 15:
            newData.append((255, 255, 255, 0))
        else:
            # Brand Green: #1a4031 (RGB: 26, 64, 49)
            newData.append((26, 64, 49, alpha))
            
    img.putdata(newData)
    # Save with high quality
    img.save(output_path, "PNG")

if __name__ == "__main__":
    make_transparent("public/lotus-logo.png", "public/lotus-logo-transparent.png")
