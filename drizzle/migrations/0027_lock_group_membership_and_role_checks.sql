CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT (_user_id = auth.uid() OR auth.role() = 'service_role')
     AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_group_member_update()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.group_id IS DISTINCT FROM OLD.group_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Membership group and member cannot be changed';
  END IF;
  IF auth.role() = 'service_role' OR public.is_group_creator(OLD.group_id) THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role
     OR (NEW.status IS DISTINCT FROM OLD.status AND NOT (OLD.status = 'invited' AND NEW.status = 'active')) THEN
    RAISE EXCEPTION 'Only the group creator can change roles or statuses';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_group_member_update() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_group_member_update ON public.collab_group_members;
CREATE TRIGGER guard_group_member_update BEFORE UPDATE ON public.collab_group_members
FOR EACH ROW EXECUTE FUNCTION public.guard_group_member_update();