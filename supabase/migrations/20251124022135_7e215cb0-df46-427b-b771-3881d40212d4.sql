-- Tornar matheusjuliodeoliveira@gmail.com super admin (se existir)
DO $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_existing_membership_id uuid;
BEGIN
  -- Buscar o user_id pelo email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'matheusjuliodeoliveira@gmail.com';
  
  -- Se não existe, apenas avisar e retornar (não falhar)
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'Usuário matheusjuliodeoliveira@gmail.com não encontrado. Super admin será configurado quando o usuário for criado.';
    RETURN;
  END IF;
  
  -- Buscar tenant do usuário
  SELECT id INTO v_tenant_id 
  FROM public.tenants 
  WHERE user_id = v_user_id 
  LIMIT 1;
  
  -- Se não tiver tenant, criar um tenant "Sistema" para o super admin
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      user_id, 
      company_name, 
      slug, 
      email, 
      subscription_status, 
      active
    )
    VALUES (
      v_user_id,
      'Sistema Admin',
      'admin-' || substr(md5(random()::text), 1, 8),
      'matheusjuliodeoliveira@gmail.com',
      'active',
      true
    )
    RETURNING id INTO v_tenant_id;
  END IF;
  
  -- Verificar se já existe membership
  SELECT id INTO v_existing_membership_id
  FROM public.tenant_memberships
  WHERE user_id = v_user_id
  LIMIT 1;
  
  -- Se existe membership, atualizar role para 3 (super admin)
  IF v_existing_membership_id IS NOT NULL THEN
    UPDATE public.tenant_memberships
    SET role = 3
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Membership atualizada para super admin (role 3)';
  ELSE
    -- Se não existe, criar nova membership com role 3
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
    VALUES (v_tenant_id, v_user_id, 3);
    
    RAISE NOTICE 'Nova membership criada com role super admin (role 3)';
  END IF;
  
  RAISE NOTICE 'Usuário % agora é super admin', 'matheusjuliodeoliveira@gmail.com';
END $$;