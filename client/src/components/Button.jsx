// variant: primary | secondary | danger | success | ghost
function Button({ variant = 'primary', size, full, className = '', type = 'button', children, ...props }) {
  const classes = ['btn', `btn-${variant}`]
  if (size === 'sm') classes.push('btn-sm')
  if (full) classes.push('btn-full')
  if (className) classes.push(className)

  return (
    <button type={type} className={classes.join(' ')} {...props}>
      {children}
    </button>
  )
}

export default Button
