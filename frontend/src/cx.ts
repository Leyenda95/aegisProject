/** Une nombres de clase, saltándose los vacíos: cx(styles.a, isOn && styles.b). */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(' ');
}
