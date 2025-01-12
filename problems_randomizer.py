
import random
import argparse


def count_problems(indicator):
    if len(indicator) == 1:
        return ord(indicator.upper()) - ord('A') + 1
    elif len(indicator) == 2 and indicator.startswith('Z'):
        return 26 + ord(indicator[1].upper()) - ord('A') + 1
    return 0


def index_to_label(index):
    return f"Z{chr(ord('A') + (index % 26))}" if index >= 26 else chr(ord('A') + index)


def get_random_problems(num_problems=1, include_easy=False, include_medium=False, include_hard=False):
    s = """
hard https://codeforces.com/group/o09Gu2FpOx/contest/559868 J
medium https://codeforces.com/group/o09Gu2FpOx/contest/559867 E
easy https://codeforces.com/group/o09Gu2FpOx/contest/559866 A
hard https://codeforces.com/group/o09Gu2FpOx/contest/542185 L
medium https://codeforces.com/group/o09Gu2FpOx/contest/542184 S
easy https://codeforces.com/group/o09Gu2FpOx/contest/542182 L
hard https://codeforces.com/group/o09Gu2FpOx/contest/542178 P
medium https://codeforces.com/group/o09Gu2FpOx/contest/542177 X
easy https://codeforces.com/group/o09Gu2FpOx/contest/542176 U
hard https://codeforces.com/group/o09Gu2FpOx/contest/541494 ZG
medium https://codeforces.com/group/o09Gu2FpOx/contest/541496 ZC
easy https://codeforces.com/group/o09Gu2FpOx/contest/541495 L
hard https://codeforces.com/group/o09Gu2FpOx/contest/541491 G
medium https://codeforces.com/group/o09Gu2FpOx/contest/541492 T
easy https://codeforces.com/group/o09Gu2FpOx/contest/541493 F
hard https://codeforces.com/group/o09Gu2FpOx/contest/541490 G
medium https://codeforces.com/group/o09Gu2FpOx/contest/541489 ZA
easy https://codeforces.com/group/o09Gu2FpOx/contest/541488 Z
hard https://codeforces.com/group/o09Gu2FpOx/contest/541484 U
medium https://codeforces.com/group/o09Gu2FpOx/contest/541486 ZF
easy https://codeforces.com/group/o09Gu2FpOx/contest/541487 A
hard https://codeforces.com/group/o09Gu2FpOx/contest/541479 N
medium https://codeforces.com/group/o09Gu2FpOx/contest/541481 ZS
easy https://codeforces.com/group/o09Gu2FpOx/contest/541477 H
    """
    problems = []
    for line in s.splitlines():
        if line.strip():
            parts = line.split()
            difficulty = parts[0].lower()
            url = parts[1]
            indicator = parts[2]

            if (difficulty == "easy" and include_easy) or \
               (difficulty == "medium" and include_medium) or \
               (difficulty == "hard" and include_hard):
                for i in range(count_problems(indicator)):
                    problems.append(f"{url}/problem/{index_to_label(i)}")

    return random.sample(problems, min(num_problems, len(problems)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-n', '--number', type=int, default=10)
    parser.add_argument('-E', '--easy', action='store_true')
    parser.add_argument('-M', '--medium', action='store_true')
    parser.add_argument('-H', '--hard', action='store_true')
    args = parser.parse_args()

    if not (args.easy or args.medium or args.hard):
        args.easy = args.medium = args.hard = True

    problems = get_random_problems(num_problems=args.number, include_easy=args.easy,
                                   include_medium=args.medium, include_hard=args.hard)

    print(f"\nHere are your {len(problems)} random problems:")
    for i, problem in enumerate(problems, 1):
        print(f"{i}. {problem}")


if __name__ == "__main__":
    main()
