/**
 * The soul pop song: an original song with jazzy chords and a shuffle.
 * Used by the sample project and the tutorial.
 */

/** Chords of the soul pop song. Rootless voicings, because the bass plays the roots. */
export const CHORD = {
    FM7: '[f3,a3,c4,e4]',
    Em7: '[e3,g3,b3,d4]',
    A7: '[g3,a3,c#4,e4]',
    Dm7: '[f3,a3,c4,d4]',
    G7: '[f3,g3,b3,d4]',
    Cmaj9: '[e3,g3,b3,d4]',
    C9: '[e3,g3,bb3,d4]',
    Fm6: '[f3,ab3,c4,d4]',
    Ebdim7: '[eb3,gb3,a3,c4]',
    G7sus4: '[f3,g3,c4,d4]'
};

/** Eight bars: | FM7 | Em7 A7 | Dm7 G7 | Cmaj9 C9 | FM7 | Fm6 | Em7 Ebdim7 | Dm7 G7sus4 | */
export const PROGRESSION = [
    ['FM7'], ['Em7', 'A7'], ['Dm7', 'G7'], ['Cmaj9', 'C9'],
    ['FM7'], ['Fm6'], ['Em7', 'Ebdim7'], ['Dm7', 'G7sus4']
];

/**
 * Lists of the song, an item for each bar. A beat is three triplets of a shuffle.
 * The piano list has only chords, and the rhythm block plays them on PIANO_RHYTHM, a beat in each item.
 * The drum list has a line of each drum, which are played together.
 */
export const SOUL = {
    piano: PROGRESSION.map(bar => bar.map(name => CHORD[name]).join(' ')),
    bass: [
        '[f2 ~ ~] [~ ~ f2] [~ ~ c2] [e2 ~ ~]',
        '[e2 ~ ~] [~ ~ e2] [a1 ~ ~] [~ ~ c#2]',
        '[d2 ~ ~] [~ ~ d2] [g1 ~ ~] [~ ~ b1]',
        '[c2 ~ ~] [~ ~ c2] [c2 ~ ~] [~ ~ e2]',
        '[f2 ~ ~] [~ ~ f2] [~ ~ c2] [~ ~ f2]',
        '[f2 ~ ~] [~ ~ f2] [~ ~ ab1] [~ ~ eb2]',
        '[e2 ~ ~] [~ ~ e2] [eb2 ~ ~] [~ ~ eb2]',
        '[d2 ~ ~] [~ ~ d2] [g1 ~ ~] [~ ~ g1]'
    ],
    melody: [
        '[~ ~ e5] [g5 ~ e5] [d5 ~ c5] [~ ~ a4]',
        '[g4 ~ ~] [~ ~ ~] [~ ~ e5] [d5 ~ c#5]',
        '[d5 ~ ~] [~ ~ f5] [e5 ~ d5] [~ ~ b4]',
        '[c5 ~ ~] [~ ~ ~] [~ ~ g4] [bb4 ~ c5]',
        '[a5 ~ ~] [g5 ~ e5] [~ ~ c5] [d5 ~ e5]',
        '[f5 ~ ~] [ab5 ~ f5] [~ ~ d5] [c5 ~ ~]',
        '[b4 ~ ~] [~ ~ d5] [c5 ~ ~] [a4 ~ ~]',
        '[d5 ~ ~] [~ ~ ~] [~ ~ ~] [~ ~ g4]'
    ],
    drums: [
        '[bd ~ ~] [~ ~ bd] [~ ~ bd] [~ ~ ~]',
        '[~ ~ ~] [sd ~ ~] [~ ~ ~] [sd ~ ~]',
        '[hh ~ hh]*4'
    ]
};
export const PIANO_RHYTHM = ['x ~ ~', '~ ~ x', 'x ~ x', '~ ~ ~'];
