-- Studio 18 — adiciona um prompt de IA detalhado (pronto para colar em
-- qualquer gerador de imagem/vídeo) em cada sugestão de conteúdo de redes
-- sociais. Rode no SQL Editor do Supabase.

alter table social_content_ideas add column if not exists visual_prompt text;

update social_content_ideas set visual_prompt =
  'Cinematic close-up video shot of hands assembling a black and gold 1:8 scale technic model car kit piece by piece on a dark wooden workbench, warm dramatic side lighting, shallow depth of field, time-lapse style motion, premium studio product photography aesthetic, carbon-fiber textured background, no faces visible, 9:16 vertical aspect ratio'
  where title = 'Um fundador, um set, zero atalhos';

update social_content_ideas set visual_prompt =
  'Split-composition editorial image: left half a moody black-and-white photograph of a classic supercar in motion (generic, no logos or brand names), right half the same car reimagined as a black and gold 1:8 scale technic building block model kit on a dark studio background, dramatic warm rim lighting, premium automotive aesthetic, clean typography space at the top for a headline, 4:5 aspect ratio'
  where title = 'Você sabia? A história real por trás do set';

update social_content_ideas set visual_prompt =
  'Macro close-up cinematic shot of hands opening a premium black product box with gold foil logo, unwrapping a technic model car kit, individual plastic bags of pieces and an instruction manual visible, warm dramatic lighting, shallow depth of field, dark carbon-fiber textured background, satisfying unboxing aesthetic, 9:16 vertical aspect ratio'
  where title = 'ASMR: o som de abrir uma caixa Studio 18';

update social_content_ideas set visual_prompt =
  'Vertical social media story template, dark carbon-black background with a subtle gold gear/emblem motif in one corner, large empty text space in the center for a question sticker, minimalist premium automotive brand aesthetic, thin gold accent line at the bottom, 9:16 aspect ratio'
  where title = 'Pergunte o que quiser sobre importação de sets técnicos';

update social_content_ideas set visual_prompt =
  'Studio product photography of three black and gold 1:8 scale technic supercar model kits arranged side by side on a dark wooden table with warm dramatic lighting, one kit spotlighted with a subtle glow to suggest limited availability, clean space at the top for a headline, carbon-fiber textured background, 4:5 aspect ratio'
  where title = 'Radar de estoque: últimas unidades do lote atual';

update social_content_ideas set visual_prompt =
  'Warm, candid lifestyle photograph of a black and gold 1:8 scale technic supercar model kit displayed on a home shelf among books and personal items, soft natural window light, authentic non-staged feel, premium collector''s room aesthetic, 4:5 aspect ratio'
  where title = 'Repost de cliente: não é still de catálogo';

update social_content_ideas set visual_prompt =
  'Dynamic vertical video shot of a black and gold 1:8 scale technic supercar model kit with visible moving steering and suspension mechanisms, dramatic warm studio lighting against a dark carbon-fiber background, quick zoom-in on the moving parts, bold on-screen text space at the top, energetic premium automotive aesthetic, 9:16 aspect ratio'
  where title = 'Dava pra comprar um Lambo funcional parado no Brasil?';

update social_content_ideas set visual_prompt =
  'Vertical video close-up of hands operating the functional steering wheel and suspension of a black and gold 1:8 scale technic model car, demonstrating real mechanical movement, dramatic warm lighting, dark studio background, direct-to-camera energetic framing with space at the top for reaction text, 9:16 aspect ratio'
  where title = '"Isso realmente funciona ou é só decoração?"';

update social_content_ideas set visual_prompt =
  'Fast time-lapse vertical video of a technic model car kit being assembled from a pile of loose black and gold pieces into a complete black and gold 1:8 scale supercar, dramatic warm studio lighting, dark carbon-fiber background, motion blur on fast-moving hands, on-screen counter overlay space at the top, 9:16 aspect ratio'
  where title = 'Time-lapse: 3.842 peças em 20 segundos';

update social_content_ideas set visual_prompt =
  'Vertical documentary-style video of neatly organized warehouse shelves stocked with black premium product boxes with gold foil logos, hands picking and packing an order, warm natural lighting mixed with practical warehouse lighting, authentic behind-the-scenes small business aesthetic, 9:16 aspect ratio'
  where title = 'Um dia na vida de quem importa sets técnicos no Brasil';

update social_content_ideas set visual_prompt =
  'Fast-paced vertical video with three quick cuts, each showing a different black and gold 1:8 scale technic supercar model kit rotating on a dark studio turntable with dramatic warm lighting, bold price tag graphic overlay space in each cut, energetic premium automotive aesthetic, 9:16 aspect ratio'
  where title = '3 sets que você não sabia que precisava';

update social_content_ideas set visual_prompt =
  'Vertical video split-scene: one side shows a shipping container and warehouse stock in Brazil, the other side shows a black and gold 1:8 scale technic supercar model kit on a dark studio background with dramatic warm lighting, bold on-screen text space for a value-proposition headline, premium yet accessible automotive aesthetic, 9:16 aspect ratio'
  where title = 'Por que sets técnicos premium não precisam custar uma fortuna';
