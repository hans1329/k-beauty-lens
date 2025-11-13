-- Update the handle_new_user function to give initial energy on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, purchased_energy)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    13  -- Initial energy bonus for new users
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Record the initial energy bonus transaction
  INSERT INTO public.energy_transactions (user_id, transaction_type, amount, description)
  VALUES (NEW.id, 'bonus', 13, 'Welcome bonus for new user');
  
  RETURN NEW;
END;
$function$;