import { PartialTypeGuard, TypeGuard } from "../guards";
import * as o from "../objects";
import { isObjectLike } from "../primitives";
import { isIntersection } from "./functions";

// tslint:disable:max-classes-per-file

export interface InterfaceBuilder<T extends {}> {
  get(): TypeGuard<T>;
  with<V>(ptv: PartialTypeGuard<{}, V>): InterfaceBuilder<T & V>;
  withProperty<K extends string, V>(key: K, ptv: TypeGuard<V>): InterfaceBuilder<T & { [prop in K]: V }>;
  withStringIndexSignature<V>(value: TypeGuard<V>, enforce?: boolean): InterfaceBuilder<T & { [prop: string]: V }>;
  withNumericIndexSignature<V>(value: TypeGuard<V>, enforce?: boolean): InterfaceBuilder<T & { [i: number]: V }>;
}

/**
 * Internal class used to represent each step in the building process.
 */
class InterfaceStep<T extends {}> implements InterfaceBuilder<T> {
  private ptt: PartialTypeGuard<{}, T>;

  public constructor(ptt: PartialTypeGuard<{}, T>) {
    this.ptt = ptt;
  }

  public get(): TypeGuard<T> {
    return (obj): obj is T => isObjectLike(obj) && this.ptt(obj);
  }

  public with<V>(ptv: PartialTypeGuard<{}, V>): InterfaceBuilder<T & V> {
    return new InterfaceStep<T & V>(isIntersection(this.ptt, ptv));
  }

  public withProperty<K extends string, V>(key: K, ptv: TypeGuard<V>): InterfaceBuilder<T & Record<K, V>> {
    return new InterfaceStep(isIntersection(this.ptt, o.hasProperty(key, ptv)));
  }

  public withStringIndexSignature<V>(value: TypeGuard<V>, enforce: boolean = true)
    : InterfaceBuilder<T & { [prop: string]: V }> {
    return new InterfaceStep(isIntersection(this.ptt, o.hasStringIndexSignature(value, enforce)));
  }

  public withNumericIndexSignature<V>(value: TypeGuard<V>, enforce: boolean = true)
    : InterfaceBuilder<T & { [i: number]: V }> {
    return new InterfaceStep(isIntersection(this.ptt, o.hasNumericIndexSignature(value, enforce)));
  }
}

/**
 * A small class to help with constructing interface checkers.
 */
export class IsInterface implements InterfaceBuilder<{}> {

  /**
   * Returns the TypeGuard for the interface. Generally used as the final call after chaining
   * the other builder methods.
   */
  public get(): TypeGuard<{}> {
    return isObjectLike;
  }

  /**
   * Validates that the given interface conforms to the given TypeGuard
   * @param ptv a PartialTypeGuard to apply to the interface.
   */
  public with<V>(ptv: PartialTypeGuard<{}, V>): InterfaceBuilder<{} & V> {
    return new InterfaceStep(ptv);
  }

  /**
   * Validates that the given interface has a property of a given type.
   * 
   * @param key the name of the property
   * @param ptv a TypeGuard which asserts the type of the property
   */
  public withProperty<K extends string, V>(key: K, ptv: TypeGuard<V>): InterfaceBuilder<Record<K, V>> {
    return new InterfaceStep(o.hasProperty(key, ptv));
  }

  /**
   * Validates that the given interface has a string index signature.
   * 
   * @param value 
   * @param enforce Whether to enforce that there is at least one property already set. Be careful setting this to false, you will
   *   get some unexpected outputs, for instance arrays will have a string index signature.
   */
  public withStringIndexSignature<V>(value: TypeGuard<V>, enforce: boolean = true)
    : InterfaceBuilder<{ [prop: string]: V }> {
    return new InterfaceStep(o.hasStringIndexSignature(value, enforce));
  }

  /**
   * Validates that the given interface has a numeric index signature.
   * 
   * @param value 
   * @param enforce Whether to enforce that there is at least one property already set. Be careful setting this to false, you will
   *    get some unexpected outputs, for instance objects will have a numeric index signature.
   */
  public withNumericIndexSignature<V>(value: TypeGuard<V>, enforce: boolean = true)
    : InterfaceBuilder<{ [i: number]: V }> {
    return new InterfaceStep(o.hasNumericIndexSignature(value, enforce));
  }
}
