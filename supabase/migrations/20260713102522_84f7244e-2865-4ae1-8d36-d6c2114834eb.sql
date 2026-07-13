
CREATE POLICY "orc bucket read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'orcamentos');
CREATE POLICY "orc bucket insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'orcamentos' AND (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "orc bucket update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'orcamentos' AND (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "orc bucket delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'orcamentos' AND (public.has_role(auth.uid(),'orcamentos') OR public.has_role(auth.uid(),'admin')));
