from dataclasses import dataclass


@dataclass
class Transfer:
    from_player: str
    to_player: str
    amount: float


def calculate_settlement(balances: dict[str, float]) -> list[Transfer]:
    """
    Greedy O(n log n) settlement algorithm.

    Args:
        balances: dict mapping player name → net balance (positive = owed money, negative = owes money)

    Returns:
        Minimal list of transfers to settle all debts.
    """
    # Filter out zero balances
    debtors = sorted(
        [(name, -bal) for name, bal in balances.items() if bal < -0.005],
        key=lambda x: x[1],
        reverse=True,
    )  # (name, amount_owed), largest first
    creditors = sorted(
        [(name, bal) for name, bal in balances.items() if bal > 0.005],
        key=lambda x: x[1],
        reverse=True,
    )  # (name, amount_to_receive), largest first

    transfers: list[Transfer] = []

    d_idx, c_idx = 0, 0
    debtors_list = [list(d) for d in debtors]
    creditors_list = [list(c) for c in creditors]

    while d_idx < len(debtors_list) and c_idx < len(creditors_list):
        debtor_name, debt = debtors_list[d_idx]
        creditor_name, credit = creditors_list[c_idx]

        amount = min(debt, credit)
        transfers.append(Transfer(from_player=debtor_name, to_player=creditor_name, amount=round(amount, 2)))

        debtors_list[d_idx][1] -= amount
        creditors_list[c_idx][1] -= amount

        if debtors_list[d_idx][1] < 0.005:
            d_idx += 1
        if creditors_list[c_idx][1] < 0.005:
            c_idx += 1

    return transfers
