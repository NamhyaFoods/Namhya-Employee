export const validateEmail = (email: string): boolean => {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return pattern.test(email)
}

export const validatePassword = (password: string): boolean => {
  return password.length >= 6
}

export const validatePhone = (phone: string): boolean => {
  const pattern = /^\+?[0-9]{10,15}$/
  return pattern.test(phone)
}

export const validateTaskTitle = (title: string): boolean => {
  return title.trim().length >= 3
}

export const validateHours = (hours: number): boolean => {
  return hours > 0 && hours <= 100
}

export const validateProgress = (progress: number): boolean => {
  return progress >= 0 && progress <= 100
}

export const validateScore = (score: number): boolean => {
  return score >= 0 && score <= 5
}