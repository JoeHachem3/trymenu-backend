const restaurant = require('../api/models/restaurant');

const getAlikeUsers = (main, nb, users) => {
  let similarUsers = {
    count: 0,
    next: null,
    k: 0,
  };
  if (main.restaurants.length < 1) {
    return similarUsers;
  }

  let counter = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    main.restaurants.forEach((restaurant) => {
      const userResto = user.restaurants.find((resto) => {
        return resto._id.toString() == restaurant._id.toString();
      });
      restaurant.ratedItems.forEach((item) => {
        if (userResto) {
          const userItem = userResto.ratedItems.find((userItem) => {
            return userItem._id._id.toString() === item._id._id.toString();
          });
          if (userItem) {
            const temp1 = item.rating - main.averageRating;
            const temp2 = userItem.rating - user.averageRating;
            numerator += temp1 * temp2;
            denominator1 += temp1 * temp1;
            denominator2 += temp2 * temp2;
          }
        }
      });
    });

    const tmpUser = { ...user, restaurants: user.restaurants };
    // if simil === 0 no correlation       X
    // if simil < 0 negative correlation  X
    // if simil > 0 positive correlation  V
    if (numerator < 0) console.log('negative');
    if (numerator === 0) console.log('null');
    if (numerator > 0) {
      tmpUser.simil = numerator / Math.sqrt(denominator1 * denominator2);
      console.log('positive');

      if (counter === 0) {
        tmpUser.next = null;
        similarUsers.next = tmpUser;
        // k
        // if (tmpUser.simil >= 0)
        similarUsers.k += tmpUser.simil;
        // else similarUsers.k -= tmpUser.simil;

        counter++;
      } else if (counter < nb) {
        tmpUser.next = null;
        let prev = similarUsers;
        let cur = similarUsers.next;
        while (cur !== null) {
          if (tmpUser.simil < cur.simil) {
            tmpUser.next = cur;
            prev.next = tmpUser;
            // k
            // if (tmpUser.simil >= 0)
            similarUsers.k += tmpUser.simil;
            // else similarUsers.k -= tmpUser.simil;

            break;
          } else {
            prev = cur;
            cur = cur.next;
          }
        }
        if (cur === null) {
          prev.next = tmpUser;
          // k
          // if (tmpUser.simil >= 0)
          similarUsers.k += tmpUser.simil;
          // else similarUsers.k -= tmpUser.simil;
        }
        counter++;
      } else {
        if (similarUsers.next.simil >= 0.5) {
          break;
        }
        if (tmpUser.simil > similarUsers.next.simil) {
          // remove k
          // if (similarUsers.next.simil >= 0)
          similarUsers.k -= similarUsers.next.simil;
          // else similarUsers.k += similarUsers.simil;
          // add k
          // if (tmpUser.simil >= 0)
          similarUsers.k += tmpUser.simil;
          // else similarUsers.k -= tmpUser.simil;
          tmpUser.next = null;
          let prev = similarUsers.next;
          similarUsers.next = similarUsers.next.next;
          prev = similarUsers.next;

          let cur = prev.next;
          while (cur !== null) {
            if (tmpUser.simil < cur.simil) {
              tmpUser.next = cur;
              prev.next = tmpUser;
              break;
            }
            prev = cur;
            cur = cur.next;
          }
          if (cur === null) {
            prev.next = tmpUser;
          }
        }
      }
    }
  }
  // similarUsers are sorted from least to most similar
  // for calculation efficiency!
  // if counter === nb, replace a similar user or no?
  similarUsers.count = counter;
  if (similarUsers.k > 0) {
    similarUsers.k = 1 / similarUsers.k;
  }
  // simil goes from 0 to 1 or -1
  // let cur = similarUsers.next;
  // while (cur !== null) {
  //   console.log(cur.simil);
  //   cur = cur.next;
  // }
  // reverse the list to most to least similar
  similarUsers.next = reverseList(similarUsers.next);
  // cur = similarUsers.next;
  // while (cur !== null) {
  //   console.log(cur.simil);
  //   cur = cur.next;
  // }
  return similarUsers;
};

const reverseList = (head) => {
  if (head == null) {
    return head;
  }
  let original = head;
  let cur = { ...original, restaurants: original.restaurants };
  let reversedList = undefined;
  while (original !== null) {
    if (reversedList === undefined) {
      reversedList = cur;
      reversedList.next = null;
    } else {
      const tmp = reversedList;
      reversedList = cur;
      reversedList.next = tmp;
    }
    original = original.next;
    if (original !== null) {
      cur = { ...original, restaurants: original.restaurants };
    }
  }
  return reversedList;
};

const getExpectedRating = (similarUsers, restaurantId, item) => {
  let sum = 0;
  let cur = similarUsers.next;
  while (cur !== null) {
    const resto = cur.restaurants.find(
      (resto) => resto._id.toString() === restaurantId.toString(),
    );
    if (resto) {
      const tmp = resto.ratedItems.find(
        (i) => i._id._id.toString() === item._id.toString(),
      );
      if (tmp) {
        sum += cur.simil * tmp.rating;
      }
    }

    cur = cur.next;
  }
  return (similarUsers.k * sum).toFixed(5);
};

exports.allRecommendedItems = (main, users) => {
  const similarUsers = getAlikeUsers(main, 10, users);
  let recommendedItems = [];
  let restaurantsRecommendedItems = [];
  let cur = similarUsers.next;
  let differentItems;
  while (cur !== null) {
    cur.restaurants.forEach((restaurant) => {
      const mainResto = main.restaurants.find(
        (resto) => resto._id.toString() === restaurant._id.toString(),
      );
      if (!mainResto) {
        differentItems = restaurant.ratedItems.filter((item) => {
          return !recommendedItems.find(
            (i) => i.item._id.toString() === item._id._id.toString(),
          );
        });
      } else {
        differentItems = restaurant.ratedItems.filter((item) => {
          return (
            !mainResto.ratedItems.find(
              (i) => i._id._id.toString() === item._id._id.toString(),
            ) &&
            !recommendedItems.find(
              (i) => i.item._id.toString() === item._id._id.toString(),
            )
          );
        });
      }
      let tmpResto;
      const tmpRestaurants = [];
      for (let i = 0; i < restaurantsRecommendedItems.length; i++) {
        if (
          restaurantsRecommendedItems[i]._id.toString() ===
          restaurant._id.toString()
        ) {
          tmpResto = restaurantsRecommendedItems[i];
        } else {
          tmpRestaurants.push(restaurantsRecommendedItems[i]);
        }
      }
      if (!tmpResto) {
        tmpResto = { _id: restaurant._id, recommendedItems: [] };
      }
      differentItems.forEach((item) => {
        // console.log(tmpResto._id);
        const tmpItem = {
          item: item._id,
          rating: getExpectedRating(similarUsers, restaurant._id, item._id),
        };
        tmpResto.recommendedItems.push(tmpItem);
        recommendedItems.push(tmpItem);
      });
      tmpResto.recommendedItems.sort((a, b) => b.rating - a.rating);
      if (tmpResto.recommendedItems.length) {
        tmpRestaurants.push(tmpResto);
      }
      restaurantsRecommendedItems = tmpRestaurants;
      // recommendedItems = recommendedItems.concat(tmpResto.recommendedItems);
      // console.log(recommendedItems);
    });

    cur = cur.next;
  }
  console.log(restaurantsRecommendedItems);
  return [
    restaurantsRecommendedItems.sort((a, b) => {
      return b.recommendedItems[0].rating - a.recommendedItems[0].rating;
    }),
    recommendedItems.sort((a, b) => b.rating - a.rating),
  ];
};

// every function has to change (average rating of the restaurant)
exports.recommendedItems = (main, users, restaurantId) => {
  const similarUsers = getAlikeUsers(main, 10, users);
  let recommendedItems = [];
  let cur = similarUsers.next;
  const differentItems = [];
  const mainResto = main.restaurants.find(
    (resto) => resto._id.toString() === restaurantId,
  );
  if (!mainResto) {
    return null;
  }
  while (cur !== null) {
    const curResto = cur.restaurants.find(
      (resto) => resto._id.toString() === restaurantId,
    );
    if (curResto) {
      const differentItems = curResto.ratedItems.filter((item) => {
        return (
          !mainResto.ratedItems.find(
            (i) => i._id._id.toString() === item._id._id.toString(),
          ) &&
          !recommendedItems.find(
            (i) => i._id._id.toString() === item._id._id.toString(),
          )
        );
      });
    }
    differentItems.forEach((item) => {
      recommendedItems.push({
        item: item.item,
        rating: getExpectedRating(similarUsers, restaurantId, item.item),
      });
    });
    cur = cur.next;
  }
  return recommendedItems.sort((a, b) => b.rating - a.rating);
};
