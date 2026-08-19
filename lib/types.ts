export type Hotspot={id:string;x:number;y:number;size:number;color:string;name:string;brand:string;price:string;description:string;url:string};
export type RoomImage={id:string;url:string;alt:string;order:number;hotspots:Hotspot[]};
export type Project={id:string;title:string;subtitle:string;categoryId:string;eyebrow:string;videoUrl:string;published:boolean;createdAt:string;images:RoomImage[]};
export type Category={id:string;name:string;order:number};
export type Settings={siteName:string;logoUrl:string;faviconUrl:string;heroTitle:string;heroDescription:string;seoTitle:string;seoDescription:string;ogImage:string;footerText:string;serviceStatus:'live'|'maintenance';adminId:string;adminPasswordHash:string};
export type Database={categories:Category[];projects:Project[];settings:Settings};
