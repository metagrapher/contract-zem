/**
 * @template T, E
 */
export class Result {
  /**
   * @param {T | null} value 
   * @param {E | null} error 
   */
  constructor(value, error) {
    this.value = value;
    this.error = error;
  }

  static Ok(value) {
    return new Result(value, null);
  }

  static Err(error) {
    return new Result(null, error);
  }

  isOk() {
    return this.error === null;
  }

  isErr() {
    return this.error !== null;
  }
}
