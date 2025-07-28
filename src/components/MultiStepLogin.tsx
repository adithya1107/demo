// Fix for line 188 (handleCollegeValidation)
const collegeQuery = supabase
  .from('colleges')
  .select('id, name, code')
  .eq('code', formData.college_code)
  .single();

const collegeData = await dbSecurityValidator.validateAndExecuteQuery(
  collegeQuery,
  'select',
  'college_validation'
) as CollegeData | null;

// Fix for line 353 (handleLogin - user profile validation)
const profileQuery = supabase
  .from('user_profiles')
  .select('*')
  .eq('id', authData.user.id)
  .single();

const profileData = await dbSecurityValidator.validateAndExecuteQuery(
  profileQuery,
  'select',
  'user_profile_validation'
) as UserProfile | null;

// Fix for line 385 (handleLogin - college verification) 
const collegeVerificationQuery = supabase
  .from('colleges')
  .select('id, name, code')
  .eq('code', formData.college_code)
  .single();

const collegeData = await dbSecurityValidator.validateAndExecuteQuery(
  collegeVerificationQuery,
  'select',
  'college_verification'
) as CollegeData | null;
