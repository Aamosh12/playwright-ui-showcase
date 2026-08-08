import { Page, ViewportSize } from "@playwright/test";

type ViewportKey = keyof typeof allViewports;

interface EnabledViewport {
  name: ViewportKey ;
  size: (typeof allViewports)[ViewportKey]
}

export const allViewports : Record<string, ViewportSize>= {
    Desktop: { width: 1920, height: 1000 },
    Laptop:  { width: 1230, height: 1000 },
    Tablet:  { width: 768,  height: 1000 },
    Mobile:  { width: 412,  height: 1000 }
}

// Named objects ready to use in test
export const Desktop = {name : "Desktop", size: allViewports.Desktop}
export const Laptop = {name : "Laptop", size: allViewports.Laptop}
export const Tablet = {name: "Tablet", size : allViewports.Tablet}
export const Mobile = {name: "Mobile", size: allViewports.Mobile}

export async function setViewport(page: Page, viewPortSize: ViewportSize) : Promise<void>{
  await page.setViewportSize(viewPortSize)
}

export function getEnabledViewports(keys: ViewportKey[]): EnabledViewport[]{
  if(!keys || keys.length===0) return []
  return keys.map(k=> ({name: k, size: allViewports[k]}))
}

const ORDERED_KEY_DISC = Object.entries(allViewports)
      .sort((a,b)=> b[1].width - a[1].width)
      .map(([k])=> k)

export function mapSizeToViewportName(size: ViewportSize | null ) : ViewportKey
{
  if(!size || typeof size.width !== "number")
  {
    return "Desktop"
  }
  const w = size.width;

  // for exact match
  for(const [name, vp] of Object.entries(allViewports))
  {
    if(vp.width== w)
    {
      return name as ViewportKey;
    }
  }

  // Pick the first one whose width <= curent width
  for(const name of ORDERED_KEY_DISC)
  {
    if(w >= allViewports[name].width)
    {
      return name as ViewportKey;
    }
  }
  return "Mobile";
}

// read the viewport from playwright page and map it to a name
export function getViewportNameFromPage(page: Page): ViewportKey
{
  const size = page.viewportSize?.() || null;
  return mapSizeToViewportName(size)
}