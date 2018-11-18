import { all, DI, inject } from '@aurelia/kernel';
import { AttrSyntax } from './ast';
import { IAttributePattern, IAttributePatternHandler, Interpretation, ISyntaxInterpreter } from './attribute-pattern';
import { Char } from './common';

export interface IAttributeParser {
  parse(name: string, value: string): AttrSyntax;
}

export const IAttributeParser = DI.createInterface<IAttributeParser>()
  .withDefault(x => x.singleton(AttributeParser));

/*@internal*/
@inject(ISyntaxInterpreter, all(IAttributePattern))
export class AttributeParser implements IAttributeParser {
  private interpreter: ISyntaxInterpreter;
  private cache: Record<string, Interpretation>;
  private patterns: Record<string, IAttributePatternHandler>;

  constructor(interpreter: ISyntaxInterpreter, attrPatterns: IAttributePattern[]) {
    this.interpreter = interpreter;
    this.cache = {};
    const patterns: AttributeParser['patterns'] = this.patterns = {};
    attrPatterns.forEach(attrPattern => {
      const patternOrPatterns = attrPattern.$patterns;
      interpreter.add(patternOrPatterns);
      if (Array.isArray(patternOrPatterns)) {
        patternOrPatterns.forEach(pattern => {
          patterns[pattern] = attrPattern as unknown as IAttributePatternHandler;
        });
      } else {
        patterns[patternOrPatterns] = attrPattern as unknown as IAttributePatternHandler;
      }
    });
  }

  public parse(name: string, value: string): AttrSyntax {
    let interpretation = this.cache[name];
    if (interpretation === undefined) {
      interpretation = this.cache[name] = this.interpreter.interpret(name);
    }
    const pattern = interpretation.pattern;
    if (pattern === null) {
      return new AttrSyntax(name, value, name, null);
    } else {
      return this.patterns[pattern][pattern](name, value, interpretation.parts);
    }
  }
}
