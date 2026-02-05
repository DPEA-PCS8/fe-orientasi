import { useState, useCallback, type ChangeEvent } from 'react';
import type { LoginCredentials } from '../types/auth.types';

interface ValidationErrors {
  username?: string;
  password?: string;
}

interface UseLoginFormReturn {
  values: LoginCredentials;
  errors: ValidationErrors;
  touched: Record<string, boolean>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleBlur: (field: string) => void;
  handleRememberMeChange: (checked: boolean) => void;
  validateForm: () => boolean;
  resetForm: () => void;
}

const initialValues: LoginCredentials = {
  username: '',
  password: '',
  rememberMe: false,
};

export const useLoginForm = (): UseLoginFormReturn => {
  const [values, setValues] = useState<LoginCredentials>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case 'username':
        if (!value.trim()) {
          return 'Username wajib diisi';
        }
        if (value.length < 3) {
          return 'Username minimal 3 karakter';
        }
        break;
      case 'password':
        if (!value) {
          return 'Password wajib diisi';
        }
        if (value.length < 6) {
          return 'Password minimal 6 karakter';
        }
        break;
    }
    return '';
  }, []);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setValues((prev) => ({ ...prev, [name]: value }));

      // Validate on change if field was touched
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const value = values[field as keyof LoginCredentials];
      if (typeof value === 'string') {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [values, validateField]
  );

  const handleRememberMeChange = useCallback((checked: boolean) => {
    setValues((prev) => ({ ...prev, rememberMe: checked }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    const usernameError = validateField('username', values.username);
    if (usernameError) {
      newErrors.username = usernameError;
      isValid = false;
    }

    const passwordError = validateField('password', values.password);
    if (passwordError) {
      newErrors.password = passwordError;
      isValid = false;
    }

    setErrors(newErrors);
    setTouched({ username: true, password: true });
    return isValid;
  }, [values, validateField]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleRememberMeChange,
    validateForm,
    resetForm,
  };
};
