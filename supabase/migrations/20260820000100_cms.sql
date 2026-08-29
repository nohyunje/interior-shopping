create table if not exists public.categories (
  id text primary key,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists public.projects (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  eyebrow text not null default '',
  video_url text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.project_images (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  url text not null,
  alt text not null default '',
  sort_order integer not null default 0
);

create table if not exists public.hotspots (
  id text primary key,
  image_id text not null references public.project_images(id) on delete cascade,
  x double precision not null check (x between 0 and 100),
  y double precision not null check (y between 0 and 100),
  size integer not null check (size between 16 and 80),
  color text not null,
  name text not null,
  brand text not null default '',
  price text not null default '',
  description text not null default '',
  purchase_url text not null default ''
);

create table if not exists public.site_settings (
  id text primary key check (id = 'singleton'),
  site_name text not null,
  logo_url text not null default '',
  favicon_url text not null default '',
  hero_title text not null,
  hero_description text not null,
  seo_title text not null,
  seo_description text not null,
  og_image text not null,
  footer_text text not null,
  service_status text not null check (service_status in ('live','maintenance'))
);

create index if not exists projects_category_id_idx on public.projects(category_id);
create index if not exists project_images_project_id_sort_order_idx on public.project_images(project_id,sort_order);
create index if not exists hotspots_image_id_idx on public.hotspots(image_id);

alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.hotspots enable row level security;
alter table public.site_settings enable row level security;

create or replace function public.cms_replace(p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  category jsonb;
  project jsonb;
  image jsonb;
  hotspot jsonb;
  settings jsonb := p_payload->'settings';
begin
  if jsonb_typeof(p_payload->'categories') <> 'array'
     or jsonb_typeof(p_payload->'projects') <> 'array'
     or jsonb_typeof(settings) <> 'object' then
    raise exception 'Invalid CMS payload';
  end if;

  delete from public.hotspots where true;
  delete from public.project_images where true;
  delete from public.projects where true;
  delete from public.categories where true;

  for category in select value from jsonb_array_elements(p_payload->'categories') loop
    insert into public.categories(id,name,sort_order)
    values (category->>'id',category->>'name',coalesce((category->>'order')::integer,0));
  end loop;

  for project in select value from jsonb_array_elements(p_payload->'projects') loop
    insert into public.projects(id,title,subtitle,category_id,eyebrow,video_url,published,created_at)
    values (project->>'id',project->>'title',coalesce(project->>'subtitle',''),project->>'categoryId',coalesce(project->>'eyebrow',''),coalesce(project->>'videoUrl',''),coalesce((project->>'published')::boolean,false),coalesce(nullif(project->>'createdAt','')::timestamptz,now()));

    for image in select value from jsonb_array_elements(coalesce(project->'images','[]'::jsonb)) loop
      insert into public.project_images(id,project_id,url,alt,sort_order)
      values (image->>'id',project->>'id',image->>'url',coalesce(image->>'alt',''),coalesce((image->>'order')::integer,0));

      for hotspot in select value from jsonb_array_elements(coalesce(image->'hotspots','[]'::jsonb)) loop
        insert into public.hotspots(id,image_id,x,y,size,color,name,brand,price,description,purchase_url)
        values (hotspot->>'id',image->>'id',(hotspot->>'x')::double precision,(hotspot->>'y')::double precision,(hotspot->>'size')::integer,hotspot->>'color',hotspot->>'name',coalesce(hotspot->>'brand',''),coalesce(hotspot->>'price',''),coalesce(hotspot->>'description',''),coalesce(hotspot->>'url',''));
      end loop;
    end loop;
  end loop;

  insert into public.site_settings(id,site_name,logo_url,favicon_url,hero_title,hero_description,seo_title,seo_description,og_image,footer_text,service_status)
  values ('singleton',settings->>'siteName',coalesce(settings->>'logoUrl',''),coalesce(settings->>'faviconUrl',''),settings->>'heroTitle',settings->>'heroDescription',settings->>'seoTitle',settings->>'seoDescription',settings->>'ogImage',settings->>'footerText',settings->>'serviceStatus')
  on conflict (id) do update set site_name=excluded.site_name,logo_url=excluded.logo_url,favicon_url=excluded.favicon_url,hero_title=excluded.hero_title,hero_description=excluded.hero_description,seo_title=excluded.seo_title,seo_description=excluded.seo_description,og_image=excluded.og_image,footer_text=excluded.footer_text,service_status=excluded.service_status;
end;
$$;

revoke all on function public.cms_replace(jsonb) from public,anon,authenticated;
grant execute on function public.cms_replace(jsonb) to service_role;
grant select on table public.categories, public.projects, public.project_images, public.hotspots, public.site_settings to service_role;

insert into public.categories(id,name,sort_order) values
('cat-1','거실',0),('cat-2','주방',1),('cat-3','침실',2),('cat-4','홈오피스',3),('cat-5','다이닝',4),('cat-6','베란다',5),('cat-7','조명',6),('cat-8','소품',7)
on conflict (id) do nothing;

insert into public.projects(id,title,subtitle,category_id,eyebrow,video_url,published,created_at) values
('project-1','빛이 머무는 신혼집 거실','내추럴 우드와 부클레로 완성한 온화한 공간','cat-1','WARM MINIMAL · 32평','https://youtube.com',true,now()),
('project-2','고요한 호텔 감성 침실','하루의 끝을 위한 차분한 레이어','cat-3','CURATED SPACE','https://youtube.com',true,now()),
('project-3','오래 머무는 다이닝','대화가 자연스럽게 이어지는 테이블','cat-5','CURATED SPACE','https://youtube.com',true,now()),
('project-4','작지만 깊이 있는 홈오피스','집중과 휴식 사이의 작은 서재','cat-4','CURATED SPACE','https://youtube.com',true,now()),
('project-5','질감으로 채운 모던 주방','스테인리스와 오크의 선명한 균형','cat-2','CURATED SPACE','https://youtube.com',true,now()),
('project-6','햇살 좋은 작은 베란다','도심 속에 만든 초록빛 쉼표','cat-6','CURATED SPACE','https://youtube.com',true,now())
on conflict (id) do nothing;

insert into public.project_images(id,project_id,url,alt,sort_order) values
('image-1','project-1','/interior-living.png','따뜻한 미니멀 거실',0),
('image-2','project-2','/interior-living.png','고요한 호텔 감성 침실',0),
('image-3','project-3','/interior-living.png','오래 머무는 다이닝',0),
('image-4','project-4','/interior-living.png','작지만 깊이 있는 홈오피스',0),
('image-5','project-5','/interior-living.png','질감으로 채운 모던 주방',0),
('image-6','project-6','/interior-living.png','햇살 좋은 작은 베란다',0)
on conflict (id) do nothing;

insert into public.hotspots(id,image_id,x,y,size,color,name,brand,price,description,purchase_url) values
('spot-1','image-1',52,66,32,'#21211f','누아 모듈 소파 4인','FRITZ HANSEN','3,890,000원','부드러운 곡선과 깊은 좌방석의 모듈 소파','https://ohou.se'),
('spot-2','image-1',40,78,32,'#b15b35','월넛 로우 테이블','MENU','1,240,000원','묵직한 월넛 결이 살아 있는 낮은 테이블','https://ohou.se'),
('spot-3','image-1',80,69,32,'#d87545','카멜 레더 라운지 체어','HAY','980,000원','시간이 지날수록 멋스러운 천연 가죽 체어','https://ohou.se'),
('spot-4','image-1',87,24,32,'#c99b63','와시 페이퍼 펜던트','&TRADITION','460,000원','공간에 은은한 빛을 더하는 종이 조명','https://ohou.se')
on conflict (id) do nothing;

insert into public.site_settings(id,site_name,logo_url,favicon_url,hero_title,hero_description,seo_title,seo_description,og_image,footer_text,service_status)
values ('singleton','ROOM VIEW','','','마음에 드는 공간을 둘러보고','마음에 드는 가구를 바로 만나보세요.','ROOM VIEW | 공간을 먼저 보고, 가구를 선택하다','인테리어 공간을 먼저 참고하고, 어울리는 가구와 제품을 찾아볼 수 있는 공간 큐레이션 페이지입니다.','/interior-living.png','공간을 보고, 가구를 발견하는 새로운 방식','live')
on conflict (id) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('cms-assets','cms-assets',true,10485760,array['image/jpeg','image/png','image/webp','image/x-icon','image/vnd.microsoft.icon'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
