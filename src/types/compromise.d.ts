declare module "compromise" {
  interface Conjugation {
    Infinitive?: string;
    Present?: string;
    Past?: string;
    Gerund?: string;
    PastTense?: string;
    PresentTense?: string;
  }

  interface NLP {
    verbs(): {
      conjugate(): Conjugation[];
    };
    nouns(): {
      toPlural(): NLP[];
      text(): string;
    };
    adjectives(): {
      toComparative(): NLP[];
      text(): string;
    };
  }

  function nlp(text: string): NLP;
  export = nlp;
} 