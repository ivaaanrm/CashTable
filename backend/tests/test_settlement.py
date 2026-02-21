import pytest

from backend.services.settlement import Transfer, calculate_settlement


def test_two_players_simple():
    """One winner, one loser."""
    balances = {"Alice": 10.0, "Bob": -10.0}
    transfers = calculate_settlement(balances)
    assert transfers == [Transfer(from_player="Bob", to_player="Alice", amount=10.0)]


def test_four_players_multiple_debtors_and_creditors():
    """Multiple debtors and creditors settle correctly."""
    balances = {"Alice": 15.0, "Bob": -5.0, "Carol": 5.0, "Dave": -15.0}
    transfers = calculate_settlement(balances)

    # Verify that all debts/credits cancel out
    net = {}
    for t in transfers:
        net[t.from_player] = net.get(t.from_player, 0) - t.amount
        net[t.to_player] = net.get(t.to_player, 0) + t.amount

    for name, balance in balances.items():
        assert abs(net.get(name, 0) - balance) < 0.01, f"{name} not settled correctly"

    # Total transfers should be minimal
    assert len(transfers) <= 3


def test_zero_balance_player_excluded():
    """A player with zero balance generates no transfers."""
    balances = {"Alice": 10.0, "Bob": -10.0, "Carol": 0.0}
    transfers = calculate_settlement(balances)
    names = [t.from_player for t in transfers] + [t.to_player for t in transfers]
    assert "Carol" not in names
    assert len(transfers) == 1


def test_all_zero_balances():
    """When everyone is even, no transfers needed."""
    balances = {"Alice": 0.0, "Bob": 0.0, "Carol": 0.0}
    transfers = calculate_settlement(balances)
    assert transfers == []


def test_floating_point_tolerance():
    """Balances that sum to near-zero (within 0.01) are handled gracefully."""
    # Simulate chip-value rounding: total in != total out by small amount
    balances = {"Alice": 10.005, "Bob": -10.0}
    transfers = calculate_settlement(balances)
    # Should produce at most one transfer and not crash
    assert len(transfers) <= 1
    if transfers:
        assert abs(transfers[0].amount - 10.0) < 0.01
