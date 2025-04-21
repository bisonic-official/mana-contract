"""Main script to execute the PIXEL price update on scheduled time."""

import time

import schedule

from utils.config import load_config
from utils.config import setup_custom_logger
from utils.pixel import get_price
from utils.pixel import update_price


def update_pixel_price():
    """Function to run the PIXEL price update."""

    # Load config and setup logger
    config = load_config('config.ron.ini')
    _ = setup_custom_logger()

    # Run PIXEL price updater
    value_in_usdc = get_price(config)
    update_price(config, value_in_usdc)


if __name__ == '__main__':

    # Setup logger
    _ = setup_custom_logger()

    # Program price update to execute every Saturday at 6 am
    # schedule.every().saturday.at('06:00',
    #                              'America/Mexico_City').do(update_pixel_price)

    # Program price update to execute every day at 3 am and 3 pm
    # schedule.every().day.at('03:00',
    #                         'America/Mexico_City').do(update_pixel_price)
    # schedule.every().day.at('15:00',
    #                         'America/Mexico_City').do(update_pixel_price)

    # Program price update to execute every 6 hours at min 30
    schedule.every(1).hours.at(":00").do(update_pixel_price)

    # Run scheduled tasks
    while True:
        schedule.run_pending()
        time.sleep(1)
