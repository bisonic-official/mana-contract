"""Main script to execute the PIXEL price update on scheduled time."""

from utils.config import load_config
from utils.config import setup_custom_logger
from utils.pixel import get_price
from utils.pixel import update_price

if __name__ == '__main__':

    # Load config and setup logger
    config = load_config('config.ron.ini')
    _ = setup_custom_logger()

    # Run PIXEL price updater
    value_in_usdc = get_price(config)
    update_price(config, value_in_usdc)
