ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS owner_user_id uuid;
COMMENT ON COLUMN public.opportunities.owner_user_id IS 'When set, the row was generated from one student''s assistant activity and is visible only to that student (and admins). NULL = shared catalog.';

UPDATE public.opportunities SET owner_user_id = '5b379138-f65c-4f48-906b-28fb12d42c81'
WHERE is_demo = false AND id IN (
 'b01c8e7f-3ef3-49c3-b1df-170949503359','37b0189d-c4c2-49e1-8ace-9605a84adc39','94569fff-3e56-4484-86ef-8861cbc21566',
 '5a23d34e-f4ec-402f-9e76-f12f9ddc18eb','73590ef7-04e6-4dd2-aff2-6a181a92830e','65a796d0-749b-404b-bc05-02420b94212e',
 '77df13ae-3583-4f45-9556-d1ac3f6027a5','724e582d-6872-479e-b249-0378b82890c1','e7899c2a-4f5c-4e04-a2eb-0b4671eb1441',
 'aa3bf08c-4713-4cd8-8388-60b971ec2248','7c1d4e5d-daf6-485a-8750-21d8ee3b118b');

DROP POLICY IF EXISTS "Signed-in students read opportunities" ON public.opportunities;
CREATE POLICY "Signed-in students read shared or own opportunities" ON public.opportunities
FOR SELECT TO authenticated
USING (owner_user_id IS NULL OR owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));